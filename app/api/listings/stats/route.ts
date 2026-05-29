import { NextRequest, NextResponse } from "next/server";

import { getListingsStats } from "@/src/lib/db/queries";

function parseNumber(value: string | null, fieldName: string) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const minLat = parseNumber(searchParams.get("minLat"), "minLat");
    const maxLat = parseNumber(searchParams.get("maxLat"), "maxLat");
    const minLng = parseNumber(searchParams.get("minLng"), "minLng");
    const maxLng = parseNumber(searchParams.get("maxLng"), "maxLng");

    if (minLat === null || maxLat === null || minLng === null || maxLng === null) {
      return NextResponse.json({ error: "Bounding box parameters are required" }, { status: 400 });
    }

    const stats = await getListingsStats({ minLat, maxLat, minLng, maxLng });

    return NextResponse.json({ data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
