import { NextResponse } from "next/server";

import { deleteBin, updateBin } from "@/lib/store";
import type { UpdateBinInput } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    binId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let payload: UpdateBinInput;

  try {
    payload = (await request.json()) as UpdateBinInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.name || !payload.location || !payload.area) {
    return NextResponse.json(
      { error: "name, location, and area are required" },
      { status: 400 },
    );
  }

  const { binId } = await context.params;

  try {
    const bin = await updateBin(binId, {
      name: payload.name.trim(),
      location: payload.location.trim(),
      area: payload.area.trim(),
      notes: payload.notes?.trim(),
    });

    if (!bin) {
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, bin });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update bin" },
      { status: 400 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { binId } = await context.params;

  try {
    const deleted = await deleteBin(binId);

    if (!deleted) {
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete bin" },
      { status: 400 },
    );
  }
}
