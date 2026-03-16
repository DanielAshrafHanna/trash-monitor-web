import { listBins, listEvents } from "@/lib/store";

function formatDate(value: string | null) {
  if (!value) {
    return "No data yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "full") {
    return "bg-[rgba(255,111,76,0.18)] text-[#7a1d0b] ring-1 ring-[rgba(201,73,39,0.22)]";
  }

  if (status === "collecting") {
    return "bg-[rgba(255,193,59,0.18)] text-[#6d4a00] ring-1 ring-[rgba(201,145,11,0.2)]";
  }

  return "bg-[rgba(57,178,115,0.16)] text-[#114c2f] ring-1 ring-[rgba(30,119,73,0.18)]";
}

export default async function Home() {
  const [bins, events] = await Promise.all([listBins(), listEvents()]);
  const fullCount = bins.filter((bin) => bin.status === "full").length;
  const collectingCount = bins.filter((bin) => bin.status === "collecting").length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,236,219,0.95),_transparent_38%),linear-gradient(160deg,_#f7f1e8_0%,_#ebe1d2_42%,_#dce8df_100%)] px-5 py-8 text-[#17251c] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="overflow-hidden rounded-[32px] border border-white/50 bg-[linear-gradient(135deg,_rgba(22,37,28,0.9),_rgba(27,58,43,0.78))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(21,38,28,0.22)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d5ead8]">
                Waste Monitoring Control Room
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Track full trash bins the moment each ESP32 receives its RF alert.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d8e6db] sm:text-base">
                This dashboard is ready for your webhook flow: one trash can, one RF
                transmitter, one ESP32 bridge, one alert into the operations view.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] bg-white/10 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-[#b9d2be]">
                  Active Bins
                </p>
                <p className="mt-3 text-3xl font-semibold">{bins.length}</p>
              </div>
              <div className="rounded-[24px] bg-[rgba(255,111,76,0.18)] px-5 py-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-[#ffd1c6]">
                  Full Alerts
                </p>
                <p className="mt-3 text-3xl font-semibold">{fullCount}</p>
              </div>
              <div className="rounded-[24px] bg-[rgba(255,193,59,0.18)] px-5 py-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-[#ffe7a9]">
                  Collecting
                </p>
                <p className="mt-3 text-3xl font-semibold">{collectingCount}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="grid gap-5">
            {bins.map((bin) => (
              <article
                key={bin.id}
                className="rounded-[28px] border border-white/70 bg-[rgba(255,251,246,0.86)] p-6 shadow-[0_18px_60px_rgba(49,58,46,0.08)] backdrop-blur"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#17251c]">
                        {bin.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusTone(
                          bin.status,
                        )}`}
                      >
                        {bin.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#516257]">{bin.notes}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-[#324239] sm:text-right">
                    <div>
                      <span className="font-semibold text-[#17251c]">Bin ID:</span>{" "}
                      {bin.id}
                    </div>
                    <div>
                      <span className="font-semibold text-[#17251c]">Device ID:</span>{" "}
                      {bin.deviceId}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] bg-[#f4ede2] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#7d6a51]">
                      Location
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#2e2a24]">
                      {bin.location}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-[#edf4ed] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5c7a64]">
                      Area
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#203225]">{bin.area}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f7e7da] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#8d5a38]">
                      Last RF Alert
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#342018]">
                      {formatDate(bin.lastSignalAt)}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-[#e7eef8] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#506780]">
                      Last Collection
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#1e2b39]">
                      {formatDate(bin.lastCollectionTime)}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#213126]">Fill level</span>
                    <span className="text-[#516257]">
                      {bin.fullnessPercent}% / {bin.thresholdPercent}% threshold
                    </span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#d8dece]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#2d7f59,_#f2a63b,_#dd5635)]"
                      style={{ width: `${Math.min(bin.fullnessPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="grid gap-6">
            <section className="rounded-[28px] border border-white/70 bg-[rgba(255,251,246,0.86)] p-6 shadow-[0_18px_60px_rgba(49,58,46,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#66755d]">
                Webhook Endpoint
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Ready for ESP32 alerts
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#516257]">
                Your firmware can POST to <code>/api/bin-event</code> whenever the
                learned RF code is detected.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-[22px] bg-[#1a2a20] p-4 text-xs leading-6 text-[#dcefe1]">
{`{
  "deviceId": "esp32-bin-02",
  "status": "full",
  "fullnessPercent": 76
}`}
              </pre>
              <p className="mt-4 text-xs leading-6 text-[#6a786f]">
                Add the optional <code>x-webhook-secret</code> header later by setting
                <code> WEBHOOK_SECRET </code> in the deployed app.
              </p>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-[rgba(255,251,246,0.86)] p-6 shadow-[0_18px_60px_rgba(49,58,46,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#66755d]">
                Recent Events
              </p>
              <div className="mt-5 grid gap-4">
                {events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-[22px] bg-[#f4eee5] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#17251c]">
                          {event.binId}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#7b6b57]">
                          {event.type.replace("_", " ")}
                        </p>
                      </div>
                      <span className="text-xs text-[#6c7a70]">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#4e5d53]">
                      {event.message}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
