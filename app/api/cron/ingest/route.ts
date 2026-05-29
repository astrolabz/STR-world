import { NextRequest, NextResponse } from "next/server";

import { getDefaultConnectors } from "@/src/lib/ingestion/default-connectors";
import { IngestionRunner } from "@/src/lib/ingestion/runner";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.INGESTION_CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "INGESTION_CRON_SECRET is not configured" }, { status: 500 });
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : authorization;

  if (token !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runner = new IngestionRunner(getDefaultConnectors());
  const result = await runner.run();

  if (result.status === "failed") {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
