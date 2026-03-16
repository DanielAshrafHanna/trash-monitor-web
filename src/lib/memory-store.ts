import { randomUUID } from "crypto";

import type { Bin, BinEvent, BinWebhookPayload } from "@/lib/types";

type StoreShape = {
  bins: Bin[];
  events: BinEvent[];
};

const seedBins: Bin[] = [
  {
    id: "bin-01",
    deviceId: "esp32-bin-01",
    name: "Downtown Plaza",
    location: "Gate A, Downtown Plaza",
    area: "Central District",
    status: "normal",
    fullnessPercent: 24,
    thresholdPercent: 70,
    lastSignalAt: null,
    lastCollectionTime: "2026-03-16T06:30:00.000Z",
    notes: "Food court entrance",
  },
  {
    id: "bin-02",
    deviceId: "esp32-bin-02",
    name: "Riverside Walk",
    location: "Dock 3 pedestrian strip",
    area: "East Bank",
    status: "full",
    fullnessPercent: 78,
    thresholdPercent: 70,
    lastSignalAt: "2026-03-16T12:05:00.000Z",
    lastCollectionTime: "2026-03-15T19:20:00.000Z",
    notes: "High weekend foot traffic",
  },
  {
    id: "bin-03",
    deviceId: "esp32-bin-03",
    name: "Campus North",
    location: "Engineering building exit",
    area: "University Zone",
    status: "collecting",
    fullnessPercent: 71,
    thresholdPercent: 70,
    lastSignalAt: "2026-03-16T11:42:00.000Z",
    lastCollectionTime: "2026-03-16T11:55:00.000Z",
    notes: "Night collection route",
  },
];

const seedEvents: BinEvent[] = [
  {
    id: randomUUID(),
    binId: "bin-02",
    deviceId: "esp32-bin-02",
    type: "bin_full",
    createdAt: "2026-03-16T12:05:00.000Z",
    source: "rf-webhook",
    message: "RF threshold alert received from the assigned ESP32.",
  },
  {
    id: randomUUID(),
    binId: "bin-03",
    deviceId: "esp32-bin-03",
    type: "collected",
    createdAt: "2026-03-16T11:55:00.000Z",
    source: "operator",
    message: "Collection team marked the bin as serviced.",
  },
];

declare global {
  var trashMonitorStore: StoreShape | undefined;
}

function cloneInitialStore(): StoreShape {
  return {
    bins: seedBins.map((bin) => ({ ...bin })),
    events: seedEvents.map((event) => ({ ...event })),
  };
}

function getStore(): StoreShape {
  if (!globalThis.trashMonitorStore) {
    globalThis.trashMonitorStore = cloneInitialStore();
  }

  return globalThis.trashMonitorStore;
}

export async function listMemoryBins(): Promise<Bin[]> {
  return [...getStore().bins].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listMemoryEvents(limit = 8): Promise<BinEvent[]> {
  return [...getStore().events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function markMemoryBinCollected(binId: string): Promise<Bin | null> {
  const store = getStore();
  const bin = store.bins.find((entry) => entry.id === binId);

  if (!bin) {
    return null;
  }

  const now = new Date().toISOString();
  bin.status = "normal";
  bin.fullnessPercent = 0;
  bin.lastCollectionTime = now;

  store.events.unshift({
    id: randomUUID(),
    binId: bin.id,
    deviceId: bin.deviceId,
    type: "collected",
    createdAt: now,
    source: "operator",
    message: "Bin marked as collected from the dashboard API.",
  });

  return { ...bin };
}

export async function ingestMemoryWebhook(
  payload: BinWebhookPayload,
): Promise<Bin | null> {
  const store = getStore();
  const bin = store.bins.find(
    (entry) =>
      entry.deviceId === payload.deviceId ||
      (payload.binId ? entry.id === payload.binId : false),
  );

  if (!bin) {
    return null;
  }

  const triggeredAt = payload.triggeredAt ?? new Date().toISOString();
  const reportedState =
    payload.fullnessPercent === "NORMAL" || payload.status === "normal"
      ? "normal"
      : payload.fullnessPercent === "FULL" || payload.status === "full"
        ? "full"
        : "full";
  const fullnessPercent =
    typeof payload.fullnessPercent === "number"
      ? Math.min(Math.max(payload.fullnessPercent, 0), 100)
      : reportedState === "full"
        ? 100
        : 0;

  bin.status = reportedState;
  bin.fullnessPercent = fullnessPercent;
  bin.lastSignalAt = triggeredAt;

  store.events.unshift({
    id: randomUUID(),
    binId: bin.id,
    deviceId: bin.deviceId,
    type: reportedState === "full" ? "bin_full" : "status_reset",
    createdAt: triggeredAt,
    source: "rf-webhook",
    message:
      reportedState === "full"
        ? "Webhook received from the RF bridge for a full bin alert."
        : "Webhook received from the RF bridge marking the bin as normal.",
  });

  return { ...bin };
}
