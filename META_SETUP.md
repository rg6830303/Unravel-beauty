# Meta (WhatsApp Cloud API) Setup

## 1. Business prerequisites
1. Create/verify **Meta Business Portfolio**: business.facebook.com → Settings → Business info. Complete **Business Verification** (legal docs + domain/phone). Needed for higher messaging tiers and display name approval.
2. Have a phone number **not currently registered on WhatsApp / WhatsApp Business app** (or migrate/delete it from the app first). Must receive SMS or voice call.

## 2. Create the app
1. developers.facebook.com → My Apps → **Create App** → use case "Other" → type **Business** → link your Business Portfolio.
2. In the app dashboard → **Add product → WhatsApp → Set up**.
3. WhatsApp → **API Setup**: add your real phone number (Add phone number → display name → verify by OTP).
4. Copy **Phone number ID** → `WA_PHONE_NUMBER_ID` and **WhatsApp Business Account ID** → `WA_BUSINESS_ACCOUNT_ID`.

## 3. Permanent access token
1. business.facebook.com → Settings → Users → **System users** → Add (role Admin).
2. **Add assets** → assign your app (Full control) and your WhatsApp account (Full control).
3. **Generate new token** → select app → expiration **Never** → permissions: `whatsapp_business_messaging`, `whatsapp_business_management`, `business_management`.
4. Save → `WA_ACCESS_TOKEN`.
5. App → Settings → Basic → **App ID** → `WA_APP_ID`, **App Secret** → `WA_APP_SECRET` (required — webhooks without a valid signature are rejected).

## 4. Payment
WhatsApp Manager → Account tools → **Payment methods** → add card. Marketing messages are charged per delivered message; without payment, template sends fail.

## 5. Deploy, then connect webhook
1. Deploy this app to Vercel (see README) so you have `https://YOUR-APP.vercel.app`.
2. Easiest: dashboard → **Setup & health** → **Connect Meta webhooks** (sets the callback URL, subscribes every field below and subscribes the app to your WhatsApp account). Manual alternative — App → WhatsApp → **Configuration** → Webhook → Edit:
   - Callback URL: `https://YOUR-APP.vercel.app/api/webhook`
   - Verify token: same value as `WA_VERIFY_TOKEN`
3. **Webhook fields → Subscribe** to all of these (each one powers an automatic protection):
   - `messages` — delivery/read/failed status + inbound chats (required)
   - `phone_number_quality_update` — tier changes / quality flags → auto-pause on RED
   - `message_template_status_update`, `message_template_quality_update`, `template_category_update` — a paused/rejected/re-categorised template stops its campaigns
   - `account_update`, `account_alerts` — restrictions/violations → auto-pause everything
4. Subscribe app to WABA (usually automatic; if not):
   `curl -X POST "https://graph.facebook.com/v21.0/WABA_ID/subscribed_apps" -H "Authorization: Bearer TOKEN"`

## 6. Register the number (if API Setup did not)
```
curl -X POST "https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/register" \
 -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
 -d '{"messaging_product":"whatsapp","pin":"123456"}'
```

## 7. Templates
1. WhatsApp Manager → **Message templates → Create** → Category **Marketing**.
2. Use `{{1}}`, `{{2}}` for variables; add sample values; optional image header + quick-reply "Stop promotions" button (Meta provides this – include it, it reduces blocks).
3. Wait for **Approved**, then in dashboard → Templates → **Sync from Meta**.

## 8. App mode
App → top toggle **Live** mode (requires Privacy Policy URL in Settings → Basic).

## 9. Grow your limits
- New numbers start at a limited number of unique users per 24h; tiers rise automatically with good **quality rating** and volume.
- Monitor WhatsApp Manager → Phone numbers → Quality rating. Red = pause campaigns.

## 10. Marketing Messages Lite API (MM API for WhatsApp) — recommended
Meta's dedicated marketing-message path with delivery optimization. WhatsApp Manager → Overview → **Marketing Messages** onboarding (if eligible in your region). Once onboarded, sends to the same `/messages` endpoint are routed through it (or use `/marketing_messages` per Meta docs). Improves deliverability; still not 100%.

## 11. WhatsApp Business Tools (MCP + dashboard)
Meta's official **WhatsApp Business Tools MCP** (`https://mcp.facebook.com/whatsapp_business_tools`, beta) is preconfigured in `.mcp.json`. Open Claude Code in this repo, run `/mcp`, sign in with your Meta developer account (no client ID / redirect URI needed) and grant `business_management`, `whatsapp_business_management`, `whatsapp_business_messaging`. Verify with "list my WhatsApp businesses" (`whatsapp_biz_businesses`).

The same tool set is built into the dashboard so day-to-day work does not need an agent. It runs on `WA_ACCESS_TOKEN` (system user token) via `/api/meta/<tool>`:

| MCP tool | Dashboard | API |
|---|---|---|
| `whatsapp_biz_businesses` / `_accounts` / `_phone_numbers` | WhatsApp Business page | `GET /api/meta/businesses`, `accounts?business_id=`, `phone_numbers` |
| `_add_phone_number` → `_send_verification_code` → `_verify_phone_number` → `_register_phone_number` | WhatsApp Business → Onboard a number | `POST /api/meta/add_phone_number` … `register_phone_number` |
| `_list_templates` / `_get_template` / `_create_template` / `_update_template` / `_delete_template` | Templates page | `GET list_templates`, `get_template?id=`; `POST create_template`, `update_template`, `delete_template` |
| `_send_message` | Inbox (24h window) / campaigns | `POST send_message` (requires `confirm: true`) |
| `_configure_webhooks` / `_subscribe_webhook` | Setup & health → Connect Meta webhooks | `POST /api/health` |
| `_verify_business` / `_configure_payments` / `_system_user_token` | WhatsApp Business page (links into Business Settings) | `GET verify_business?business_id=`, `configure_payments`, `system_user_token?business_id=` |
| token check | WhatsApp Business → Access token | `GET token` (needs `WA_APP_ID`/`WA_APP_SECRET`) |

Session messages also support interactive reply buttons, lists, CTA URL buttons, media and the typing indicator (`lib/whatsapp.ts`), following Meta's Jasper's Market sample.
