# WA Outreach — WhatsApp marketing + AI support (Next.js on Vercel + Supabase)

## Features
- **Dashboard**: audience health, sent/delivered/read/failed (7d), failure reasons by Meta error code.
- **Contacts**: CSV upload, E.164 normalization, landline/invalid rejection, dedupe, tags, custom attributes, opt-in/out, per-contact AI toggle.
- **WhatsApp-account flagging**: contacts marked `invalid` on Meta error **131026**; marked `valid` on any delivery/read/inbound. Invalid contacts are excluded at campaign creation **and** re-checked right before each send.
- **Campaigns**: MARKETING templates only (utility/auth rejected), variables (`{{name}}`, `{{any_csv_column}}`), media headers, tag targeting, scheduling, throttling, pause/resume, live stats.
- **Reliable dispatcher**: Supabase queue (`FOR UPDATE SKIP LOCKED`), exponential backoff on rate limits/transient errors, 131049 auto-retry after 26h, no duplicates.
- **Inbox**: two-way chat, 24h-window enforcement, read receipts.
- **Auto-reply**: STOP/START compliance → keyword rules → Claude AI agent grounded on your knowledge base.

## Deploy
1. Supabase: new project → SQL editor → run `supabase/schema.sql`. Copy URL + service_role key.
2. Push this folder to GitHub → Vercel → Import. Add all vars from `.env.example`.
3. Vercel cron calls `/api/cron/dispatch` every minute with `Authorization: Bearer $CRON_SECRET` (needs **Pro** plan for per-minute crons; Hobby = daily only → use cron-job.org hitting the URL with that header).
4. Follow `META_SETUP.md`.
5. Local: `npm install && npm run dev`.

## Testing checklist
- Webhook verify: Meta "Verify and save" succeeds.
- Send WhatsApp "hi" to your number → appears in Inbox, AI replies.
- Upload CSV with your own number + a landline + a non-WhatsApp mobile → landline rejected on import; non-WhatsApp flagged after first send attempt.
- Campaign to a tag with 2–3 test numbers → watch Delivered %.
