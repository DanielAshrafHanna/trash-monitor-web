import { NextResponse } from "next/server";

import { markBinCollected } from "@/lib/store";

type RouteContext = {
  params: Promise<{ binId: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { binId } = await context.params;
  const updated = await markBinCollected(binId);

  if (!updated) {
    return NextResponse.json({ error: "Bin not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    bin: updated,
  });
}
