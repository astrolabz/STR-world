import { NextRequest, NextResponse } from "next/server";

import { getIngestionJobs } from "@/src/lib/db/queries";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const jobs = await getIngestionJobs(limit);

  return NextResponse.json({ data: jobs });
}
