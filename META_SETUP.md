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
5. App → Settings → Basic → **App Secret** → `WA_APP_SECRET`.

## 4. Payment
WhatsApp Manager → Account tools → **Payment methods** → add card. Marketing messages are charged per delivered message; without payment, template sends fail.

## 5. Deploy, then connect webhook
1. Deploy this app to Vercel (see README) so you have `https://YOUR-APP.vercel.app`.
2. App → WhatsApp → **Configuration** → Webhook → Edit:
   - Callback URL: `https://YOUR-APP.vercel.app/api/webhook`
   - Verify token: same value as `WA_VERIFY_TOKEN`
3. **Webhook fields → Subscribe**: `messages` (required). Optional: `message_template_status_update`.
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
