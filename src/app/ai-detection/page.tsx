import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "AI Detection | Trash Monitor",
  description: "Camera-based trash bin detection demo with synthetic pitch data.",
};

type DetectionStatus = "full" | "clear" | "watch" | "cat" | "animal-clear";

type CameraDetection = {
  id: string;
  label: string;
  location: string;
  status: DetectionStatus;
  fillLevel: number;
  confidence: number;
  lastSeen: string;
  note: string;
};

type EventRow = {
  time: string;
  camera: string;
  object: string;
  result: string;
  confidence: string;
};

const cameraDetections: CameraDetection[] = [
  {
    id: "cam-01",
    label: "Green Waste Bin",
    location: "Left side of camera frame",
    status: "full",
    fillLevel: 82,
    confidence: 94,
    lastSeen: "18 seconds ago",
    note: "Visible debris is close to the rim. Collection recommended before the next service window.",
  },
  {
    id: "cam-02",
    label: "Metal Hopper Bin",
    location: "Center-right of camera frame",
    status: "watch",
    fillLevel: 63,
    confidence: 91,
    lastSeen: "42 seconds ago",
    note: "Partially filled and trending upward. Keep on the next route if capacity keeps rising.",
  },
  {
    id: "cam-03",
    label: "Cat Presence Check",
    location: "Full camera frame",
    status: "animal-clear",
    fillLevel: 0,
    confidence: 97,
    lastSeen: "1 minute ago",
    note: "No cat detected in the current frame. Collection can proceed safely.",
  },
];

const events: EventRow[] = [
  {
    time: "09:42",
    camera: "CAM-01",
    object: "Green waste bin",
    result: "Full, pickup priority high",
    confidence: "94%",
  },
  {
    time: "09:42",
    camera: "CAM-01",
    object: "Cat",
    result: "No cat detected",
    confidence: "97%",
  },
  {
    time: "09:41",
    camera: "CAM-01",
    object: "Metal hopper bin",
    result: "Watch list, rising fill level",
    confidence: "91%",
  },
  {
    time: "09:40",
    camera: "CAM-01",
    object: "Wall control panel",
    result: "Ignored, not a bin",
    confidence: "89%",
  },
];

const routeStops = [
  "Green Waste Bin",
  "Metal Hopper Bin",
  "Return only if cat alert changes",
];

function getStatusLabel(status: DetectionStatus) {
  if (status === "full") {
    return "Full";
  }

  if (status === "clear") {
    return "Clear";
  }

  if (status === "cat") {
    return "Cat Detected";
  }

  if (status === "animal-clear") {
    return "No Cat";
  }

  return "Watch";
}

function getStatusClasses(status: DetectionStatus) {
  if (status === "full") {
    return "border-[#d33f49] bg-[#fff5f5] text-[#8f1f29]";
  }

  if (status === "clear") {
    return "border-[#1f8a5b] bg-[#f0fbf5] text-[#12613d]";
  }

  if (status === "cat") {
    return "border-[#7b5cff] bg-[#f7f5ff] text-[#4430a3]";
  }

  if (status === "animal-clear") {
    return "border-[#1f8a5b] bg-[#f0fbf5] text-[#12613d]";
  }

  return "border-[#f0b429] bg-[#fffaf0] text-[#7a4d00]";
}

function getBarColor(status: DetectionStatus) {
  if (status === "full") {
    return "bg-[#d33f49]";
  }

  if (status === "clear") {
    return "bg-[#1f8a5b]";
  }

  if (status === "cat") {
    return "bg-[#7b5cff]";
  }

  if (status === "animal-clear") {
    return "bg-[#1f8a5b]";
  }

  return "bg-[#f0b429]";
}

function getMeasureLabel(status: DetectionStatus) {
  if (status === "cat" || status === "animal-clear") {
    return "Animal risk";
  }

  return "Fill estimate";
}

export default function AiDetectionPage() {
  const fullBins = cameraDetections.filter((item) => item.status === "full").length;
  const catAlerts = cameraDetections.filter((item) => item.status === "cat").length;
  const binDetections = cameraDetections.filter(
    (item) => item.status !== "cat" && item.status !== "animal-clear",
  );
  const averageFill = Math.round(
    binDetections.reduce((total, item) => total + item.fillLevel, 0) /
      binDetections.length,
  );
  const averageConfidence = Math.round(
    cameraDetections.reduce((total, item) => total + item.confidence, 0) /
      cameraDetections.length,
  );

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#111614]">
      <section className="bg-[#101412] px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#9fe0bd]">AI Camera Detection</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white">
              Trash, overflow risk, and animal safety from camera snapshots.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#dce7df]">
              Synthetic demo data for a camera-first waste monitoring pitch. The model
              classifies bin fullness, checks for cats near collection zones, and ranks the
              next pickup route.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/15 bg-white/10 p-4">
              <p className="text-sm text-[#b8c7be]">Deployment endpoint</p>
              <p className="mt-2 break-words font-mono text-sm text-white">
                /ai-detection
              </p>
            </div>
            <div className="rounded-lg border border-[#9fe0bd]/30 bg-[#163326] p-4">
              <p className="text-sm text-[#b8c7be]">Live mode</p>
              <p className="mt-2 text-2xl font-semibold text-white">Demo Feed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-[#dde4de] bg-white p-5">
            <p className="text-sm text-[#5f6b63]">Cameras online</p>
            <p className="mt-3 text-3xl font-semibold">12</p>
          </div>
          <div className="rounded-lg border border-[#dde4de] bg-white p-5">
            <p className="text-sm text-[#5f6b63]">Bins tracked</p>
            <p className="mt-3 text-3xl font-semibold">38</p>
          </div>
          <div className="rounded-lg border border-[#dde4de] bg-white p-5">
            <p className="text-sm text-[#5f6b63]">Full now</p>
            <p className="mt-3 text-3xl font-semibold text-[#d33f49]">{fullBins}</p>
          </div>
          <div className="rounded-lg border border-[#dde4de] bg-white p-5">
            <p className="text-sm text-[#5f6b63]">Cat alerts</p>
            <p className="mt-3 text-3xl font-semibold text-[#7b5cff]">{catAlerts}</p>
          </div>
          <div className="rounded-lg border border-[#dde4de] bg-white p-5">
            <p className="text-sm text-[#5f6b63]">Model confidence</p>
            <p className="mt-3 text-3xl font-semibold">{averageConfidence}%</p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="overflow-hidden rounded-lg border border-[#cfd8d1] bg-[#0f1412]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
              <div>
                <p className="font-mono text-sm text-[#9fe0bd]">CAM-01</p>
                <p className="text-sm text-[#c9d6ce]">Kitchen service area</p>
              </div>
              <p className="rounded-md bg-[#1f8a5b] px-3 py-1 text-sm font-semibold">
                Analyzing
              </p>
            </div>
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[560px] overflow-hidden bg-[#111614]">
              <Image
                alt="Camera sample of open trash bins in an indoor service area"
                className="h-full w-full object-cover opacity-95"
                fill
                priority
                sizes="(min-width: 1280px) 560px, 100vw"
                src="/trash-bin-camera-sample.jpg"
              />
              <div className="absolute left-[3%] top-[38%] h-[36%] w-[43%] border-2 border-[#d33f49] bg-[#d33f49]/10">
                <span className="absolute left-2 top-2 rounded-sm bg-[#d33f49] px-2 py-1 text-xs font-semibold text-white">
                  Full bin 94%
                </span>
              </div>
              <div className="absolute left-[38%] top-[27%] h-[33%] w-[45%] border-2 border-[#f0b429] bg-[#f0b429]/10">
                <span className="absolute left-2 top-2 rounded-sm bg-[#f0b429] px-2 py-1 text-xs font-semibold text-[#111614]">
                  Watch bin 91%
                </span>
              </div>
              <div className="absolute bottom-[9%] right-[5%] rounded-md border border-[#7b5cff] bg-[#101412]/90 px-3 py-2 text-white">
                <span className="block text-xs font-semibold text-[#ddd5ff]">
                  Cat scan clear 97%
                </span>
                <span className="mt-1 block text-[11px] text-[#c9d6ce]">
                  No animal detected
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 grid gap-3 rounded-lg border border-white/15 bg-[#101412]/85 p-4 text-white backdrop-blur sm:grid-cols-3">
                <div>
                  <p className="text-sm text-[#b8c7be]">Average fill</p>
                  <p className="mt-1 text-2xl font-semibold">{averageFill}%</p>
                </div>
                <div>
                  <p className="text-sm text-[#b8c7be]">Pickup priority</p>
                  <p className="mt-1 text-2xl font-semibold text-[#ffced2]">High</p>
                </div>
                <div>
                  <p className="text-sm text-[#b8c7be]">Animal safety</p>
                  <p className="mt-1 text-2xl font-semibold text-[#c7f2d9]">Clear</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <section className="rounded-lg border border-[#dde4de] bg-white p-5">
              <p className="text-sm font-semibold text-[#12613d]">Recommended action</p>
              <h2 className="mt-3 text-2xl font-semibold">Collect CAM-01 first.</h2>
              <p className="mt-3 leading-7 text-[#445048]">
                Dispatch one cleaner to the kitchen service area within 35 minutes.
                The current frame is clear of cats, so collection can proceed safely.
              </p>
            </section>

            <section className="rounded-lg border border-[#dde4de] bg-white p-5">
              <p className="text-sm font-semibold text-[#12613d]">Suggested route</p>
              <ol className="mt-4 grid gap-3">
                {routeStops.map((stop, index) => (
                  <li key={stop} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#111614] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-[#27302a]">{stop}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-lg border border-[#dde4de] bg-white p-5">
              <p className="text-sm font-semibold text-[#12613d]">Pitch metrics</p>
              <div className="mt-4 grid gap-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#5f6b63]">Missed overflow risk</span>
                  <span className="font-semibold text-[#d33f49]">Down 72%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#5f6b63]">Unneeded pickups</span>
                  <span className="font-semibold text-[#12613d]">Down 31%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#5f6b63]">Animal incidents</span>
                  <span className="font-semibold text-[#7b5cff]">Zero today</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="bg-white px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1fr_1fr]">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#12613d]">Detection queue</p>
                <h2 className="mt-2 text-3xl font-semibold">Current camera decisions</h2>
              </div>
              <p className="text-sm text-[#5f6b63]">Updated every 15 seconds</p>
            </div>
            <div className="mt-5 grid gap-4">
              {cameraDetections.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-[#dde4de] bg-[#fbfcfa] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-[#5f6b63]">{item.location}</p>
                    </div>
                    <span
                      className={`rounded-md border px-3 py-1 text-sm font-semibold ${getStatusClasses(
                        item.status,
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[#5f6b63]">{getMeasureLabel(item.status)}</span>
                      <span className="font-semibold">{item.fillLevel}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-sm bg-[#e6ece7]">
                      <div
                        className={`h-full ${getBarColor(item.status)}`}
                        style={{ width: `${item.fillLevel}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <p className="text-[#5f6b63]">
                      Confidence:{" "}
                      <span className="font-semibold text-[#111614]">
                        {item.confidence}%
                      </span>
                    </p>
                    <p className="text-[#5f6b63]">
                      Last seen:{" "}
                      <span className="font-semibold text-[#111614]">
                        {item.lastSeen}
                      </span>
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#445048]">{item.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#12613d]">Event log</p>
                <h2 className="mt-2 text-3xl font-semibold">Latest detections</h2>
              </div>
              <p className="text-sm text-[#5f6b63]">Synthetic sample</p>
            </div>
            <div className="mt-5 overflow-x-auto rounded-lg border border-[#dde4de]">
              <table className="min-w-[760px] w-full border-collapse bg-white text-left text-sm">
                <thead className="bg-[#101412] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Camera</th>
                    <th className="px-4 py-3 font-semibold">Object</th>
                    <th className="px-4 py-3 font-semibold">Result</th>
                    <th className="px-4 py-3 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={`${event.time}-${event.camera}-${event.object}`}
                      className="border-t border-[#dde4de]"
                    >
                      <td className="px-4 py-4 font-mono text-[#445048]">{event.time}</td>
                      <td className="px-4 py-4 font-semibold">{event.camera}</td>
                      <td className="px-4 py-4 text-[#445048]">{event.object}</td>
                      <td className="px-4 py-4 text-[#445048]">{event.result}</td>
                      <td className="px-4 py-4 font-semibold">{event.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="rounded-lg border border-[#dde4de] bg-[#f7fbff] p-5">
                <p className="text-sm font-semibold text-[#147d8f]">Operations</p>
                <p className="mt-3 text-2xl font-semibold">2 cleaners saved</p>
                <p className="mt-2 text-sm leading-6 text-[#445048]">
                  Empty bins stay off the route until their fill trend changes.
                </p>
              </article>
              <article className="rounded-lg border border-[#dde4de] bg-[#fffaf0] p-5">
                <p className="text-sm font-semibold text-[#7a4d00]">Waste estimate</p>
                <p className="mt-3 text-2xl font-semibold">124 kg today</p>
                <p className="mt-2 text-sm leading-6 text-[#445048]">
                  Fill-level trends estimate volume before the truck arrives.
                </p>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
