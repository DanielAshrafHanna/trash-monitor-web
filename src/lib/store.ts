import type { Bin, BinEvent, BinWebhookPayload } from "@/lib/types";
import {
  ingestMemoryWebhook,
  listMemoryBins,
  listMemoryEvents,
  markMemoryBinCollected,
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
  if (!hasSupabaseConfig()) {
    return ingestMemoryWebhook(payload);
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from("bins")
    .select("*")
    .or(
      payload.binId
        ? `device_id.eq.${payload.deviceId},id.eq.${payload.binId}`
        : `device_id.eq.${payload.deviceId}`,
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
  const fullnessPercent = Math.min(
    Math.max(payload.fullnessPercent ?? row.threshold_percent, 0),
    100,
  );

  const { data: updated, error: updateError } = await supabase
    .from("bins")
    .update({
      status: "full",
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
    type: "bin_full",
    created_at: triggeredAt,
    source: "rf-webhook",
    message: "Webhook received from the RF bridge for a full bin alert.",
  });

  if (eventError) {
    throw new Error(`Failed to log webhook event: ${eventError.message}`);
  }

  return mapBinRow(updated as BinRow);
}
