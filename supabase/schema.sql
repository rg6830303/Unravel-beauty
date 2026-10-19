-- Run in Supabase SQL editor
create extension if not exists pgcrypto;

create type wa_status as enum ('unknown', 'valid', 'invalid');

create table contacts (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,              -- E.164 without '+', e.g. 919876543210
  name text,
  tags text[] default '{}',
  attributes jsonb default '{}',
  wa_status wa_status default 'unknown',   -- invalid => never messaged
  wa_checked_at timestamptz,
  opted_in boolean default true,
  opted_out_at timestamptz,
  ai_enabled boolean default true,         -- per-contact auto-reply toggle
  last_inbound_at timestamptz,             -- 24h customer-service window
  marketing_fail_count int default 0,
  created_at timestamptz default now()
);
create index on contacts using gin(tags);

create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null,
  category text,
  status text,
  components jsonb,
  synced_at timestamptz default now(),
  unique (name, language)
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_name text not null,
  template_language text not null default 'en',
  variables jsonb default '[]',            -- e.g. ["{{name}}", "SALE20"]
  header_media_url text,
  audience_tags text[] default '{}',       -- empty = all valid contacts
  status text default 'draft',             -- draft|scheduled|running|completed|paused
  scheduled_at timestamptz,
  rate_per_minute int default 60,
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
  status text default 'queued',            -- queued|sent|delivered|read|failed|received|skipped
  error_code int,
  error_title text,
  attempts int default 0,
  next_attempt_at timestamptz default now(),
  is_ai boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on messages (status, next_attempt_at);
create index on messages (contact_id, created_at);
create index on messages (campaign_id, status);

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
select c.id, c.name, c.status, c.created_at,
  count(m.*) filter (where m.direction='out') total,
  count(m.*) filter (where m.status in ('sent','delivered','read')) sent,
  count(m.*) filter (where m.status in ('delivered','read')) delivered,
  count(m.*) filter (where m.status='read') read,
  count(m.*) filter (where m.status='failed') failed,
  count(m.*) filter (where m.status='skipped') skipped
from campaigns c left join messages m on m.campaign_id=c.id
group by c.id;

-- atomic claim of queued jobs for the dispatcher
create or replace function claim_messages(batch int)
returns setof messages language sql as $$
  update messages set status='sending', attempts=attempts+1, updated_at=now()
  where id in (
    select id from messages
    where direction='out' and status='queued' and next_attempt_at<=now()
    order by created_at limit batch for update skip locked)
  returning *;
$$;

alter table contacts enable row level security;
alter table templates enable row level security;
alter table campaigns enable row level security;
alter table messages enable row level security;
alter table automations enable row level security;
alter table knowledge enable row level security;
-- No policies: only the service-role key (server side) can access.
