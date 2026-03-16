import { NextResponse } from "next/server";

import { listBins } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ bins: await listBins() });
}
