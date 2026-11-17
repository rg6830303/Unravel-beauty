# WA Outreach — WhatsApp marketing + AI support (Next.js on Vercel + Supabase)

Official WhatsApp Cloud API only. No unofficial/web automation (those get numbers banned).

## How the outreach loop works
Vercel Cron calls `/api/cron/dispatch` every minute (`vercel.json`). Each pass claims queued messages — first sends and
due retries alike — sends them 20 in parallel, and stops at the campaign's per-minute rate or Meta's daily limit.
A campaign stays **running** until no message is waiting, and is reopened if Meta fails a message after accepting it.

Every failure goes through one retry policy (`lib/retry.ts`), whether Meta rejects the request or reports the failure later by webhook:

| Failure | What happens |
|---|---|
| Temporary error, network error, HTTP 5xx, unknown code | Retried after 1 min, 5 min, 15 min, 1 h, 4 h, 12 h (up to `max_retries`, default 5) |
| Meta per-user marketing cap (`131049`), experiment hold-out (`130472`) | Retried after 24 h, 48 h, 72 h, 96 h |
| Undeliverable (`131026`) | Retried after 24 h and 72 h; the number is flagged "no WhatsApp" only after the third failure |
| Rate limit (`130429`, `131048`, …) | Pass stops, messages retried 2 min later, no retry used up |
| User stopped marketing (`131050`), malformed request (`131008`, …) | Failed at once, never retried; opt-out is recorded |
| Payment / account / token (`131042`, `131031`, `190`, …) | All campaigns paused with the reason; messages stay queued |
| Template problem (`132xxx`) | That campaign paused; messages stay queued |
| Retry window over (`retry_window_days`, default 7) | Marked failed with the last reason |

Messaged-too-recently contacts are **delayed** until the frequency cap has passed, not dropped. "Retry failed" on a
campaign puts its failed messages back in the loop with a fresh allowance. Every attempt is logged in `send_attempts`.

## Other delivery protections
| Risk | What the system does |
|---|---|
| Invalid numbers | Landline/invalid numbers rejected at upload |
| Quality rating drops | Sunset rule (stop after 6 delivered-but-unread), STOP/START handling, quality webhook; **RED pauses all campaigns** |
| Daily messaging tier exceeded | Dispatcher never exceeds 95% of the tier (read from Meta); the rest goes out as the 24 h window frees up |
| Bad template / wrong parameter count | Campaign refuses to start if variable count or header media is wrong; template paused/rejected/re-categorised via webhook stops its campaigns |
| Systemic failures | Circuit breaker pauses a campaign if >25% of its last 40 attempts fail |
| Crashed run | Messages stuck in `sending` are released after 5 minutes; overlapping passes never claim the same message |
| Slow webhook → Meta disables it | Webhook acknowledges instantly, work continues in `waitUntil`; duplicate and out-of-order events ignored |
| Wrong time of day | Quiet hours (21:00–09:00 IST) and **smart send time**: each person gets it at the hour they last read/replied |

## Personalisation
Campaign variables accept `{{first_name|there}}`, `{{last_name}}`, `{{name}}`, `{{phone}}`, any CSV column (`{{city|your city}}`), and `{{link:https://…}}` which becomes a click-tracked short link. Fallbacks guarantee no empty parameter (Meta rejects those). "Preview audience" shows who is excluded and sample rendered messages before anything is queued.

## Audience
Pick contacts with checkboxes on the Contacts page ("New campaign for N selected"), or target by tag, or leave both empty for everyone.

## Deploy
1. Supabase SQL editor: `supabase/reset.sql` (only if reusing a database — **deletes everything**), then `supabase/schema.sql`,
   then the retention job at the bottom of `supabase/cron.sql` (optional).
2. Vercel project → Settings → Environment Variables: add the variables from `.env.example`, then redeploy.
3. Scheduler: `vercel.json` already runs the loop every minute on Vercel Pro. On Hobby, delete the `crons` entry and use the
   pg_cron job in `supabase/cron.sql` instead.
4. Follow `META_SETUP.md` up to the webhook step, then open **Setup & health** in the dashboard and press
   **Connect Meta webhooks**. The same page shows whether the loop, the database, the number and the webhook are live.
5. Optional: leave `ANTHROPIC_API_KEY` empty to disable AI replies (keyword auto-replies + STOP/START still work).
6. Optional: after onboarding to Marketing Messages Lite in WhatsApp Manager, set `WA_USE_MM_LITE=1`.

## Tests
`npm test` runs the real `supabase/schema.sql` in an in-process Postgres with a scripted fake of Meta's API: retry policy,
campaign creation, the loop under every failure class, webhooks, scheduler auth, and a 400-contact mixed-failure simulation.
No test talks to Meta or Supabase.

## Honest limits
No system can guarantee 100% delivery: Meta decides per-person marketing caps, users can opt out of marketing, phones can be off. This system maximises the achievable rate and shows exactly why each failure happened (Dashboard → failure reasons).
