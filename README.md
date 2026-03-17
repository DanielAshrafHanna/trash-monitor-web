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
- Lets operators edit and delete bins directly from the dashboard
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

The key field for ESP integration is `deviceId`.

The internal database `id` is generated from the saved `deviceId`, so operators do not need to manage a separate technical bin ID during setup.

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

- `Device ID`
- `Display name`
- `Location`
- `Area`

Optional:

- `Notes`

After a bin is created, an ESP32 can update it immediately as long as the ESP's configured `Webhook Device ID` matches the `Device ID` saved in the dashboard.

Recommended naming pattern:

- `Device ID`: `esp32-bin-01`
- `Display name`: `Library Entrance`

### Device ID rules

- `Device ID` is the only identifier the ESP needs to match
- if a user enters spaces, the app saves the `Device ID` in a safe format by converting spaces to hyphens
- `Display name`, `Location`, `Area`, and `Notes` keep normal readable spacing
- example:
  - typed `Device ID`: `ESP32 Bin 01`
  - saved `Device ID`: `esp32-bin-01`
  - typed `Display name`: `Main Gate Bin`
  - saved `Display name`: `Main Gate Bin`

### Step-by-step: create a new bin

Example:

1. Open the dashboard.
2. In the `Add Bin` panel, enter:
   - `Device ID`: `esp32-bin-03`
   - `Display name`: `Library Entrance`
   - `Location`: `Main Library front gate`
   - `Area`: `North Campus`
   - `Notes`: optional
3. Click `Add Bin`.
4. Confirm the new bin appears on the dashboard.

At this point the web app is ready, but the ESP will not update that bin until its webhook settings are configured with the same identifiers.

## How a new bin ties to the ESP

Each ESP is assigned to exactly one trash bin in the current system.

The key link between the dashboard and the ESP is the `Device ID`.

If the dashboard bin is created with:

- `Device ID`: `esp32-bin-03`

then the ESP responsible for that physical bin should be configured with:

- `Webhook URL`: `https://trash-monitor-web.vercel.app/api/bin-event`
- `Webhook Device ID`: `esp32-bin-03`
- `Webhook Secret`: only if webhook authentication is enabled in Vercel

The `Webhook Device ID` should always match the dashboard `Device ID` exactly.

### Important matching rule

If the IDs do not match exactly, the webhook will not update the bin.

Examples:

- dashboard `Device ID` = `esp32-bin-03`
- ESP `Webhook Device ID` = `esp32-bin-03`
- result = works

- dashboard `Device ID` = `esp32-bin-03`
- ESP `Webhook Device ID` = `esp32_bin_03`
- result = does not work

- dashboard `Device ID` = `esp32-bin-03`
- ESP `Webhook Device ID` = `esp32-bin-04`
- result = updates the wrong bin or fails

## Step-by-step: connect a newly created bin to an ESP

1. Create the bin in the dashboard.
2. Copy the exact `Device ID` you used.
3. Open that ESP's admin page.
4. In the webhook settings, set:
   - `Webhook URL` to `https://trash-monitor-web.vercel.app/api/bin-event`
   - `Webhook Device ID` to the same `Device ID` from the dashboard
   - `Webhook Secret` if your deployment requires it
5. Save the ESP settings.
6. Open the ESP RF manager page.
7. Record one RF signal as `FULL`.
8. Record one RF signal as `NORMAL`.
9. Trigger each RF transmitter once and confirm the dashboard changes.

### What the ESP sends

When the ESP receives the recorded `FULL` RF signal, it sends:

```json
{
  "deviceId": "esp32-bin-03",
  "fullnessPercent": "FULL"
}
```

When the ESP receives the recorded `NORMAL` RF signal, it sends:

```json
{
  "deviceId": "esp32-bin-03",
  "fullnessPercent": "NORMAL"
}
```

Because those IDs match the bin you created in the dashboard, the web app updates the correct card automatically.

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

### Recommended production security setup

For a real deployment, use the webhook secret.

The expected setup is:

1. Set `WEBHOOK_SECRET` in Vercel for the production web app
2. Redeploy the web app
3. Open each device's admin page
4. Set the same value in that device's `Webhook Secret` field
5. Save the device settings
6. Test with one manual webhook and one real device event

Important rule:

- the secret in Vercel and the secret saved on each device must match exactly

If they do not match, the web app returns:

```json
{"error":"Unauthorized"}
```

### Step-by-step: re-enable `WEBHOOK_SECRET`

If the project is currently running without webhook authentication and you want to turn it back on:

1. Open the project in Vercel
2. Go to `Settings`
3. Open `Environment Variables`
4. Add or update:
   - `WEBHOOK_SECRET`
5. Redeploy production
6. Open each device admin page
7. Enter the same secret in `Webhook Secret`
8. Save and restart the device if needed
9. Test a `FULL` webhook
10. Confirm the dashboard updates normally

Do not enable the secret in Vercel unless the devices are also updated, otherwise live updates will stop.

## ESP32 integration

This app is meant to work with the updated ESP32 firmware.

For each ESP:

1. Add a bin in the dashboard.
2. Copy that bin's `Device ID`.
3. On the ESP admin page, set:
   - `Webhook URL` to `https://trash-monitor-web.vercel.app/api/bin-event`
   - `Webhook Device ID` to the exact `Device ID` from the dashboard
   - `Webhook Secret` if webhook auth is enabled
4. In the ESP RF manager:
   - record one RF signal as `FULL`
   - record one RF signal as `NORMAL`

Once those values match, the ESP can update the dashboard with no further backend work.

### What happens when webhook auth is enabled

When webhook authentication is enabled:

- the web app expects the request header `x-webhook-secret`
- the device firmware can send that header automatically if `Webhook Secret` is configured on the device
- the dashboard behavior does not change for operators
- only the device configuration changes

### ESP setup summary for a new bin

For a newly added dashboard bin:

1. Create the bin in the web app first.
2. Use the same `Device ID` in the ESP admin page.
3. Record the two RF states on that ESP.
4. Test `FULL` and `NORMAL` before installing the unit in the field.

## Dashboard behavior

- The dashboard auto-refreshes while open
- `FULL` bins are highlighted for attention
- `NORMAL` bins remain visible as healthy/cleared units
- Recent events show the bin name and user-facing state changes
- Bins can be added, edited, and deleted from the dashboard

### Current operator actions

Available from the dashboard:

- add a new bin
- edit a bin's name, location, area, and notes
- delete a bin

Current limitation:

- the `Last Collection` field is not updated automatically by `FULL` and `NORMAL` webhooks
- it only changes if the legacy collection API is called or if existing data already contains a collection timestamp

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
4. If `WEBHOOK_SECRET` is enabled, an unsigned request is rejected and a signed request succeeds

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

Expected results:

- correct secret -> success response and dashboard update
- missing or wrong secret -> `{"error":"Unauthorized"}`

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
- The dashboard now uses customer-friendly wording, but the webhook/API layer still uses technical fields like `deviceId` for integration
- Device IDs are normalized to lowercase hyphenated values, so `Dany Test` becomes `dany-test`

## Recommended operational workflow

1. Add a new bin in the dashboard
2. Configure one ESP with the same `Device ID`
3. Record the `FULL` RF signal
4. Record the `NORMAL` RF signal
5. Test both states against production
6. Mount the unit in the field

## Fast checklist for a new deployment

1. Deploy the web app to Vercel
2. Configure Supabase
3. Add `WEBHOOK_SECRET` in Vercel if this is a secured deployment
4. Add the first bin from the dashboard
5. Copy the saved `Device ID`
6. Configure one device with:
   - `Webhook URL`
   - `Webhook Device ID`
   - `Webhook Secret` if enabled
7. Record the `FULL` and `NORMAL` RF signals on that device
8. Test both states
9. Repeat for the remaining bins

This README should be enough for another developer or operator to understand how the web app fits into the full trash-monitoring system and how to extend it safely.
