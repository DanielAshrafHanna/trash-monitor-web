export type BinStatus = "normal" | "full" | "collecting";

export type Bin = {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  area: string;
  status: BinStatus;
  fullnessPercent: number;
  thresholdPercent: number;
  lastSignalAt: string | null;
  lastCollectionTime: string | null;
  notes?: string;
};

export type BinEventType = "bin_full" | "collected" | "status_reset";

export type BinEvent = {
  id: string;
  binId: string;
  deviceId: string;
  type: BinEventType;
  createdAt: string;
  source: "rf-webhook" | "operator";
  message: string;
};

export type BinWebhookPayload = {
  deviceId: string;
  binId?: string;
  status?: "full";
  fullnessPercent?: number;
  triggeredAt?: string;
};
