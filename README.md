# WA Outreach — WhatsApp marketing + AI support (Next.js on Vercel + Supabase)

Official WhatsApp Cloud API only. No unofficial/web automation (those get numbers banned).

## What makes delivery better
Every failure Meta can return is either prevented before sending or handled after it.

| Risk | What the system does |
|---|---|
| Number has no WhatsApp (`131026`) | Landline/invalid numbers rejected at upload; flagged on first failure; never messaged again |
| Meta per-user marketing cap (`131049`) | Frequency cap (default 1 message / 2 days per person); automatic retry 26h later, max 2 retries |
| Quality rating drops | Sunset rule (stop after 6 delivered-but-unread), STOP/START handling, quality webhook; **RED pauses all campaigns** |
| Daily messaging tier exceeded | Dispatcher never exceeds 95% of the tier (read from Meta), so no wasted rate-limit errors |
| Bad template / wrong parameter count (`132xxx`) | Campaign refuses to start if variable count or header media is wrong; template paused/rejected/re-categorised via webhook stops its campaigns |
| Payment / account problems (`131042`, `131031`) | All campaigns auto-pause with the reason shown |
| Systemic failures | Circuit breaker pauses a campaign if >25% of its last 40 sends fail |
| Rate limits / transient errors | Exponential backoff, concurrency-limited sending (20 parallel), stuck-job recovery |
| Slow webhook → Meta disables it | Webhook acknowledges instantly, work continues in `waitUntil`; duplicate events ignored |
| Wrong time of day | Quiet hours (21:00–09:00 IST) and **smart send time**: each person gets it at the hour they last read/replied |

## Personalisation
Campaign variables accept `{{first_name|there}}`, `{{last_name}}`, `{{name}}`, `{{phone}}`, any CSV column (`{{city|your city}}`), and `{{link:https://…}}` which becomes a click-tracked short link. Fallbacks guarantee no empty parameter (Meta rejects those). "Preview audience" shows who is excluded and sample rendered messages before anything is queued.

## Deploy
1. Supabase SQL editor: `supabase/reset.sql` (only if reusing a database — **deletes everything**), then `supabase/schema.sql`.
2. Vercel: import repo, add variables from `.env.example`.
3. Scheduler (pick one):
   - **Any plan, free:** edit and run `supabase/cron.sql` (pg_cron calls `/api/cron/dispatch` every minute).
   - **Vercel Pro:** rename `vercel.pro.json` to `vercel.json` (per-minute Vercel Cron). Hobby rejects per-minute crons at deploy time.
4. Follow `META_SETUP.md` (subscribe to **all** webhook fields listed there).
5. Optional: leave `ANTHROPIC_API_KEY` empty to disable AI replies (keyword auto-replies + STOP/START still work).
6. Optional: after onboarding to Marketing Messages Lite in WhatsApp Manager, set `WA_USE_MM_LITE=1`.

## Honest limits
No system can guarantee 100% delivery: Meta decides per-person marketing caps, users can opt out of marketing, phones can be off. This system maximises the achievable rate and shows exactly why each failure happened (Dashboard → failure reasons).
