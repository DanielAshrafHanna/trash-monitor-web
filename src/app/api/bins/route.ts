import { NextResponse } from "next/server";

import { createBin, listBins } from "@/lib/store";
import type { NewBinInput } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ bins: await listBins() });
}

export async function POST(request: Request) {
  let payload: NewBinInput;

  try {
    payload = (await request.json()) as NewBinInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (
    !payload.id ||
    !payload.deviceId ||
    !payload.name ||
    !payload.location ||
    !payload.area
  ) {
    return NextResponse.json(
      { error: "id, deviceId, name, location, and area are required" },
      { status: 400 },
    );
  }

  try {
    const bin = await createBin({
      id: payload.id.trim(),
      deviceId: payload.deviceId.trim(),
      name: payload.name.trim(),
      location: payload.location.trim(),
      area: payload.area.trim(),
      notes: payload.notes?.trim(),
    });

    return NextResponse.json({ success: true, bin }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create bin",
      },
      { status: 400 },
    );
  }
}
