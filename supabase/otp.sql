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
