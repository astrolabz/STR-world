import { NextRequest, NextResponse } from "next/server";

import { getIngestionJobs } from "@/src/lib/db/queries";

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ data: [] });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const jobs = await getIngestionJobs(limit);

  return NextResponse.json({ data: jobs });
}
