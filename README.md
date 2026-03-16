# Trash Monitor Web

MVP monitoring dashboard for RF-triggered trash-bin alerts.

## What it does

- Shows a dashboard of trash bins with status, location, area, and last collection time
- Accepts webhook alerts from ESP32 devices at `POST /api/bin-event`
- Exposes a bins API at `GET /api/bins`
- Lets operators mark a bin as collected at `POST /api/bins/:binId/collect`
- Supports Supabase for hosted persistence, with an in-memory fallback for local UI work

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If no Supabase environment variables are set, the app uses demo data from the in-memory store.

## Webhook payload

```json
{
  "deviceId": "esp32-bin-02",
  "status": "full",
  "fullnessPercent": 76
}
```

If `WEBHOOK_SECRET` is set, include it in the `x-webhook-secret` header.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WEBHOOK_SECRET`
5. Run the app again.

## Deployment

Recommended hosting:
- Frontend/API: Vercel
- Database: Supabase

Set these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET`

## Notes

- The current dashboard is ready for one ESP32 per trash can
- The ESP32 firmware can continue publishing MQTT for Home Assistant later while also sending webhook alerts to this app
- The next step after this repo is updating the ESP32 firmware to send the webhook on a known RF match
