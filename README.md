# Trash Monitor Web

Hosted dashboard and webhook backend for the RF-based trash bin monitoring system.

This app is designed to work with the ESP32 firmware in the companion `esp32_relay` project. Each trash bin has:

- one ESP32 receiver
- one RF transmitter for `FULL`
- one RF transmitter for `NORMAL`

When the ESP32 receives one of its recorded RF signals, it sends a webhook to this web app. The app updates the matching bin and shows its latest state on the dashboard.

Current production deployment:
- Dashboard: [https://trash-monitor-web.vercel.app/](https://trash-monitor-web.vercel.app/)
- Webhook endpoint: `https://trash-monitor-web.vercel.app/api/bin-event`

## What the app does

- Shows all registered bins in a single dashboard
- Tracks only two operating states: `FULL` and `NORMAL`
- Displays each bin's name, location, area, last signal time, and last collection time
- Accepts webhook updates from ESP32 devices
- Logs recent events for operators
- Lets operators add new bins directly from the dashboard
- Uses Supabase for hosted persistence
- Falls back to in-memory demo data locally if Supabase is not configured

## System flow

1. A trash bin sensor triggers one of two RF transmitters.
2. The assigned ESP32 receives either the `FULL` or `NORMAL` RF signal.
3. The ESP32 sends a webhook to this app.
4. The app finds the matching bin by `deviceId` or `binId`.
5. The dashboard updates automatically.

## Current data model

Each bin record contains:

- `id`
  - Internal bin ID, for example `bin-07`
- `deviceId`
  - ESP32 identity, for example `esp32-bin-07`
- `name`
  - User-facing display name
- `location`
  - Specific placement of the bin
- `area`
  - Larger zone or section
- `status`
  - `full` or `normal`
- `lastSignalAt`
  - Last webhook/RF update time
- `lastCollectionTime`
  - Last recorded collection time
- `notes`
  - Optional operator notes

The most important field for ESP integration is `deviceId`.

If an ESP sends:

```json
{
  "deviceId": "esp32-bin-07",
  "fullnessPercent": "FULL"
}
```

the app will update the bin whose `deviceId` is `esp32-bin-07`.

## Adding bins from the dashboard

Operators can register bins directly from the web UI using the `Add Bin` panel.

Required fields:

- `Bin ID`
- `Device ID`
- `Display name`
- `Location`
- `Area`

Optional:

- `Notes`

After a bin is created, an ESP32 can update it immediately as long as the ESP's configured `Webhook Device ID` matches the `Device ID` saved in the dashboard.

Recommended naming pattern:

- `Bin ID`: `bin-01`
- `Device ID`: `esp32-bin-01`

## Webhook API

Endpoint:

```text
POST /api/bin-event
```

Production URL:

```text
https://trash-monitor-web.vercel.app/api/bin-event
```

### Supported webhook payloads

Preferred payload:

```json
{
  "deviceId": "esp32-bin-02",
  "fullnessPercent": "FULL"
}
```

Normal state:

```json
{
  "deviceId": "esp32-bin-02",
  "fullnessPercent": "NORMAL"
}
```

Also supported:

```json
{
  "deviceId": "esp32-bin-02",
  "binId": "bin-02",
  "status": "full"
}
```

Accepted payload fields:

- `deviceId` required
- `binId` optional
- `fullnessPercent` optional, supports `"FULL"` or `"NORMAL"`
- `status` optional, supports `"full"` or `"normal"`
- `triggeredAt` optional ISO timestamp

Current behavior:

- `"FULL"` maps to status `full`
- `"NORMAL"` maps to status `normal`
- if a numeric percentage is sent, the app still accepts it for compatibility, but the UI is built around `FULL` and `NORMAL`

### Security

If `WEBHOOK_SECRET` is set, requests must include:

```text
x-webhook-secret: YOUR_SECRET
```

If `WEBHOOK_SECRET` is not set, the webhook endpoint accepts requests without authentication. This was useful during testing, but production deployments should use a secret.

## ESP32 integration

This app is meant to work with the updated ESP32 firmware.

For each ESP:

1. Add a bin in the dashboard.
2. Copy that bin's `Device ID`.
3. On the ESP admin page, set:
   - `Webhook URL` to `https://trash-monitor-web.vercel.app/api/bin-event`
   - `Webhook Device ID` to the exact `Device ID` from the dashboard
   - `Webhook Bin ID` optionally to the exact `Bin ID`
   - `Webhook Secret` if webhook auth is enabled
4. In the ESP RF manager:
   - record one RF signal as `FULL`
   - record one RF signal as `NORMAL`

Once those values match, the ESP can update the dashboard with no further backend work.

## Dashboard behavior

- The dashboard auto-refreshes while open
- `FULL` bins are highlighted for attention
- `NORMAL` bins remain visible as healthy/cleared units
- Recent events show the bin name and user-facing state changes

## Local development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If Supabase is not configured, the app runs with in-memory sample data.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET`

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` comes from your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only
- `WEBHOOK_SECRET` is your own shared secret for ESP webhook requests

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the SQL in [`supabase/schema.sql`](C:\Users\danie\Desktop\RF module\trash-monitor-web\supabase\schema.sql).
4. Add the environment variables locally and in Vercel.

The schema creates the tables used by:

- bins
- bin events

## Deployment

Recommended hosting:

- Frontend and API: Vercel
- Database: Supabase

Required Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET`

After deployment, verify:

1. The dashboard loads
2. A test webhook updates a known bin
3. The page reflects the change automatically

## Example test commands

Test a `FULL` event:

```powershell
curl.exe -X POST "https://trash-monitor-web.vercel.app/api/bin-event" -H "Content-Type: application/json" -d "{\"deviceId\":\"esp32-bin-02\",\"fullnessPercent\":\"FULL\"}"
```

Test a `NORMAL` event:

```powershell
curl.exe -X POST "https://trash-monitor-web.vercel.app/api/bin-event" -H "Content-Type: application/json" -d "{\"deviceId\":\"esp32-bin-02\",\"fullnessPercent\":\"NORMAL\"}"
```

If webhook auth is enabled:

```powershell
curl.exe -X POST "https://trash-monitor-web.vercel.app/api/bin-event" -H "Content-Type: application/json" -H "x-webhook-secret: YOUR_WEBHOOK_SECRET" -d "{\"deviceId\":\"esp32-bin-02\",\"fullnessPercent\":\"FULL\"}"
```

## Main project files

- Dashboard page: [src/app/page.tsx](C:\Users\danie\Desktop\RF module\trash-monitor-web\src\app\page.tsx)
- Webhook API: [src/app/api/bin-event/route.ts](C:\Users\danie\Desktop\RF module\trash-monitor-web\src\app\api\bin-event\route.ts)
- Bin API: [src/app/api/bins/route.ts](C:\Users\danie\Desktop\RF module\trash-monitor-web\src\app\api\bins\route.ts)
- Add bin form: [src/components/add-bin-form.tsx](C:\Users\danie\Desktop\RF module\trash-monitor-web\src\components\add-bin-form.tsx)
- Store logic: [src/lib/store.ts](C:\Users\danie\Desktop\RF module\trash-monitor-web\src\lib\store.ts)
- Supabase schema: [supabase/schema.sql](C:\Users\danie\Desktop\RF module\trash-monitor-web\supabase\schema.sql)

## Known notes

- There is still a legacy internal `collect` API route in the codebase, but the current operator workflow and UI are built around `FULL` and `NORMAL`
- MQTT is intentionally not handled by this web app; MQTT remains in the ESP/Home Assistant side of the system
- Each ESP should be dedicated to one trash bin in the current architecture

## Recommended operational workflow

1. Add a new bin in the dashboard
2. Configure one ESP with the same `Device ID`
3. Record the `FULL` RF signal
4. Record the `NORMAL` RF signal
5. Test both states against production
6. Mount the unit in the field

This README should be enough for another developer or operator to understand how the web app fits into the full trash-monitoring system and how to extend it safely.
