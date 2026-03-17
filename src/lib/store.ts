import type { Bin, BinEvent, BinWebhookPayload, NewBinInput, UpdateBinInput } from "@/lib/types";
import {
  createMemoryBin,
  deleteMemoryBin,
  ingestMemoryWebhook,
  listMemoryBins,
  listMemoryEvents,
  markMemoryBinCollected,
  updateMemoryBin,
} from "@/lib/memory-store";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase";

type BinRow = {
  id: string;
  device_id: string;
  name: string;
  location: string;
  area: string;
  status: Bin["status"];
  fullness_percent: number;
  threshold_percent: number;
  last_signal_at: string | null;
  last_collection_time: string | null;
  notes: string | null;
};

type EventRow = {
  id: string;
  bin_id: string;
  device_id: string;
  type: BinEvent["type"];
  created_at: string;
  source: BinEvent["source"];
  message: string;
};

function mapBinRow(row: BinRow): Bin {
  return {
    id: row.id,
    deviceId: row.device_id,
    name: row.name,
    location: row.location,
    area: row.area,
    status: row.status,
    fullnessPercent: row.fullness_percent,
    thresholdPercent: row.threshold_percent,
    lastSignalAt: row.last_signal_at,
    lastCollectionTime: row.last_collection_time,
    notes: row.notes ?? undefined,
  };
}

function mapEventRow(row: EventRow): BinEvent {
  return {
    id: row.id,
    binId: row.bin_id,
    deviceId: row.device_id,
    type: row.type,
    createdAt: row.created_at,
    source: row.source,
    message: row.message,
  };
}

function normalizeStatus(status: Bin["status"]): "normal" | "full" {
  return status === "full" ? "full" : "normal";
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDeviceId(value: string) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, "-");
}

function getReportedState(payload: BinWebhookPayload): Bin["status"] {
  if (payload.fullnessPercent === "NORMAL" || payload.status === "normal") {
    return "normal";
  }

  if (payload.fullnessPercent === "FULL" || payload.status === "full") {
    return "full";
  }

  return "full";
}

export async function listBins(): Promise<Bin[]> {
  if (!hasSupabaseConfig()) {
    return listMemoryBins();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bins")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load bins: ${error.message}`);
  }

  return (data as BinRow[]).map(mapBinRow);
}

export async function listEvents(limit = 8): Promise<BinEvent[]> {
  if (!hasSupabaseConfig()) {
    return listMemoryEvents(limit);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bin_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load events: ${error.message}`);
  }

  return (data as EventRow[]).map(mapEventRow);
}

export async function createBin(input: NewBinInput): Promise<Bin> {
  const deviceId = normalizeDeviceId(input.deviceId);
  const name = normalizeText(input.name);
  const location = normalizeText(input.location);
  const area = normalizeText(input.area);
  const notes = input.notes ? normalizeText(input.notes) : null;

  if (!hasSupabaseConfig()) {
    return createMemoryBin({
      deviceId,
      name,
      location,
      area,
      notes: notes ?? undefined,
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bins")
    .insert({
      id: deviceId,
      device_id: deviceId,
      name,
      location,
      area,
      status: "normal",
      fullness_percent: 0,
      threshold_percent: 70,
      notes,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create bin: ${error.message}`);
  }

  return mapBinRow(data as BinRow);
}

export async function updateBin(
  binId: string,
  input: UpdateBinInput,
): Promise<Bin | null> {
  const name = normalizeText(input.name);
  const location = normalizeText(input.location);
  const area = normalizeText(input.area);
  const notes = input.notes ? normalizeText(input.notes) : null;

  if (!hasSupabaseConfig()) {
    return updateMemoryBin(binId, {
      name,
      location,
      area,
      notes: notes ?? undefined,
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bins")
    .update({
      name,
      location,
      area,
      notes,
    })
    .eq("id", binId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update bin: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapBinRow(data as BinRow);
}

export async function deleteBin(binId: string): Promise<boolean> {
  if (!hasSupabaseConfig()) {
    return deleteMemoryBin(binId);
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("bins").delete().eq("id", binId);

  if (error) {
    throw new Error(`Failed to delete bin: ${error.message}`);
  }

  return true;
}

export async function markBinCollected(binId: string): Promise<Bin | null> {
  if (!hasSupabaseConfig()) {
    return markMemoryBinCollected(binId);
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bins")
    .update({
      status: "normal",
      fullness_percent: 0,
      last_collection_time: now,
    })
    .eq("id", binId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Failed to mark bin collected: ${error.message}`);
  }

  const updated = data as BinRow;

  const { error: eventError } = await supabase.from("bin_events").insert({
    bin_id: updated.id,
    device_id: updated.device_id,
    type: "collected",
    created_at: now,
    source: "operator",
    message: "Bin marked as collected from the dashboard API.",
  });

  if (eventError) {
    throw new Error(`Failed to log collection event: ${eventError.message}`);
  }

  return mapBinRow(updated);
}

export async function ingestWebhook(
  payload: BinWebhookPayload,
): Promise<Bin | null> {
  const normalizedDeviceId = normalizeDeviceId(payload.deviceId);

  if (!hasSupabaseConfig()) {
    return ingestMemoryWebhook({
      ...payload,
      deviceId: normalizedDeviceId,
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from("bins")
    .select("*")
    .or(
      payload.binId
        ? `device_id.eq.${normalizedDeviceId},id.eq.${payload.binId}`
        : `device_id.eq.${normalizedDeviceId}`,
    )
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to find matching bin: ${lookupError.message}`);
  }

  if (!existing) {
    return null;
  }

  const row = existing as BinRow;
  const triggeredAt = payload.triggeredAt ?? new Date().toISOString();
  const reportedState = getReportedState(payload);
  const fullnessPercent =
    typeof payload.fullnessPercent === "number"
      ? Math.min(Math.max(payload.fullnessPercent, 0), 100)
      : reportedState === "full"
        ? 100
        : 0;

  const { data: updated, error: updateError } = await supabase
    .from("bins")
    .update({
      status: normalizeStatus(reportedState),
      fullness_percent: fullnessPercent,
      last_signal_at: triggeredAt,
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Failed to update bin status: ${updateError.message}`);
  }

  const { error: eventError } = await supabase.from("bin_events").insert({
    bin_id: row.id,
    device_id: row.device_id,
    type: reportedState === "full" ? "bin_full" : "status_reset",
    created_at: triggeredAt,
    source: "rf-webhook",
    message:
      reportedState === "full"
        ? "Webhook received from the RF bridge for a full bin alert."
        : "Webhook received from the RF bridge marking the bin as normal.",
  });

  if (eventError) {
    throw new Error(`Failed to log webhook event: ${eventError.message}`);
  }

  return mapBinRow(updated as BinRow);
}
