-- Run in Supabase SQL editor (fresh database; run reset.sql first if reusing one)

create type wa_status as enum ('unknown', 'valid', 'invalid');

create table contacts (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,              -- E.164 without '+', e.g. 919876543210
  name text,
  tags text[] default '{}',
  attributes jsonb default '{}',           -- any CSV column: city, plan, last_order ...
  wa_status wa_status default 'unknown',   -- invalid => never messaged
  wa_checked_at timestamptz,
  opted_in boolean default true,
  opted_out_at timestamptz,
  ai_enabled boolean default true,         -- per-contact auto-reply toggle
  last_inbound_at timestamptz,             -- 24h customer-service window
  marketing_fail_count int default 0,
  -- engagement signals (drive send-time, frequency cap and sunset rules)
  last_marketing_at timestamptz,
  last_read_at timestamptz,
  best_hour int,                           -- hour of day (0-23, business timezone) the contact usually engages
  unread_streak int default 0,             -- marketing messages delivered since last read/reply/click
  engagement_score int default 0,
  created_at timestamptz default now()
);
create index on contacts using gin(tags);
create index on contacts (wa_status, opted_in);

create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null,
  category text,
  status text,
  quality_score text,
  components jsonb,
  synced_at timestamptz default now(),
  unique (name, language)
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_name text not null,
  template_language text not null default 'en',
  variables jsonb default '[]',            -- e.g. ["{{first_name|there}}", "{{city|your city}}", "{{link:https://x.com/offer}}"]
  header_media_url text,
  audience_tags text[] default '{}',       -- empty = all valid contacts
  smart_send_time boolean default true,    -- deliver at each contact's best hour
  status text default 'draft',             -- draft|scheduled|running|completed|paused
  pause_reason text,
  scheduled_at timestamptz,
  rate_per_minute int default 600,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  direction text not null,                 -- in|out
  type text default 'text',
  body text,
  payload jsonb,
  wa_message_id text unique,
  status text default 'queued',            -- queued|sending|sent|delivered|read|failed|received|skipped
  error_code int,
  error_title text,
  attempts int default 0,                  -- API send attempts made
  retry_count int default 0,               -- failed deliveries that were re-queued by the retry loop
  next_attempt_at timestamptz default now(),
  expires_at timestamptz,                  -- retry loop gives up after this moment
  is_ai boolean default false,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on messages (status, next_attempt_at);
create index on messages (contact_id, created_at);
create index on messages (campaign_id, status);
create index on messages (direction, created_at);

-- tracked links: {{link:https://...}} in campaign variables becomes https://APP/r/<token>
create table links (
  token text primary key,
  url text not null,
  message_id uuid references messages(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  clicks int default 0,
  first_click_at timestamptz,
  created_at timestamptz default now()
);
create index on links (campaign_id);

-- webhook idempotency + audit trail (pruned by cron.sql)
create table wa_events (
  id text primary key,                     -- "<wamid>:<status>" or field:timestamp
  kind text,
  created_at timestamptz default now()
);

-- one row per send attempt / failure: the audit trail of the retry loop (pruned by cron.sql)
create table send_attempts (
  id bigint generated always as identity primary key,
  message_id uuid references messages(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  source text not null,                    -- api (synchronous Meta response) | webhook (asynchronous failure)
  ok boolean not null,
  error_code int,
  error_title text,
  action text,                             -- sent | retry | fail | pause_all | pause_campaign
  created_at timestamptz default now()
);
create index on send_attempts (message_id);
create index on send_attempts (campaign_id, created_at);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
insert into settings (key, value) values
  ('frequency_cap_days', '2'),             -- min days between marketing messages to one person (protects against 131049)
  ('sunset_after', '6'),                   -- stop marketing after N delivered-but-unread messages
  ('quiet_start', '21'),                   -- no marketing sends between 21:00 ...
  ('quiet_end', '9'),                      -- ... and 09:00 (business timezone)
  ('default_send_hour', '11'),             -- used when a contact has no engagement history
  ('timezone', '"Asia/Kolkata"'),
  ('auto_pause_fail_pct', '25'),           -- pause a campaign if >25% of last 40 sends fail
  ('max_retries', '5'),                    -- retry loop: re-send a failed message up to N times
  ('retry_window_days', '7'),              -- ... and give up this many days after the campaign start
  ('dispatcher_last_run', '{}'),           -- heartbeat written by the dispatcher loop
  ('daily_cap_override', 'null'),          -- optional manual cap on unique recipients / 24h
  ('phone_health', '{}');                  -- written by webhook/dispatcher: quality rating + messaging tier

create table automations (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,                   -- case-insensitive exact/contains match
  match_type text default 'contains',
  reply text not null,
  active boolean default true
);

create table knowledge (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null
);

create view campaign_stats as
select c.id, c.name, c.status, c.pause_reason, c.created_at,
  count(m.*) filter (where m.direction='out') total,
  count(m.*) filter (where m.status in ('sent','delivered','read')) sent,
  count(m.*) filter (where m.status in ('delivered','read')) delivered,
  count(m.*) filter (where m.status='read') read,
  count(m.*) filter (where m.status='failed') failed,
  count(m.*) filter (where m.status='skipped') skipped,
  count(m.*) filter (where m.status in ('queued','sending')) pending,
  count(m.*) filter (where m.status in ('queued','sending') and m.retry_count>0) retrying,
  coalesce((select sum(l.clicks) from links l where l.campaign_id=c.id),0) clicks
from campaigns c left join messages m on m.campaign_id=c.id
group by c.id;

-- atomic claim of queued jobs for the dispatcher
create or replace function claim_messages(batch int)
returns setof messages language sql as $$
  update messages set status='sending', updated_at=now()
  where id in (
    select m.id from messages m
    where m.direction='out' and m.status='queued' and m.next_attempt_at<=now()
      and (m.campaign_id is null or exists (select 1 from campaigns c where c.id=m.campaign_id and c.status='running'))
    order by m.next_attempt_at limit batch for update of m skip locked)
  returning *;
$$;

-- recover jobs stuck in 'sending' (function crashed mid-run)
create or replace function release_stuck_messages()
returns int language sql as $$
  with r as (
    update messages set status='queued'
    where status='sending' and updated_at < now() - interval '5 minutes'
    returning 1)
  select count(*)::int from r;
$$;

-- unique people given a business-initiated template in the last 24h (Meta messaging-tier accounting)
create or replace function unique_recipients_24h()
returns int language sql stable as $$
  select count(distinct contact_id)::int from messages
  where direction='out' and type='template' and sent_at > now() - interval '24 hours';
$$;

alter table contacts enable row level security;
alter table templates enable row level security;
alter table campaigns enable row level security;
alter table messages enable row level security;
alter table automations enable row level security;
alter table knowledge enable row level security;
alter table links enable row level security;
alter table wa_events enable row level security;
alter table settings enable row level security;
alter table send_attempts enable row level security;
-- No policies: only the service-role key (server side) can access.

-- One-time passcodes for phone verification (sent with a WhatsApp AUTHENTICATION template).
-- Only a keyed hash of each code is stored, never the code itself.
create table if not exists otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed boolean not null default false,
  wa_message_id text,
  created_at timestamptz not null default now()
);
create index if not exists otp_codes_phone_created on otp_codes (phone, created_at desc);
alter table otp_codes enable row level security;  -- service role only; no policies = no public access
