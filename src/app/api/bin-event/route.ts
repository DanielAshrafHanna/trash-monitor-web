import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ingestWebhook } from "@/lib/store";
import type { BinWebhookPayload } from "@/lib/types";

function isAuthorized(request: Request) {
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    return true;
  }

  const providedSecret = request.headers.get("x-webhook-secret");
  return providedSecret === expectedSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: BinWebhookPayload;

  try {
    payload = (await request.json()) as BinWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.deviceId) {
    return NextResponse.json(
      { error: "deviceId is required" },
      { status: 400 },
    );
  }

  const updated = await ingestWebhook(payload);

  if (!updated) {
    return NextResponse.json(
      { error: "No matching bin found for this deviceId/binId" },
      { status: 404 },
    );
  }

  revalidatePath("/");

  return NextResponse.json({
    success: true,
    bin: updated,
  });
}
