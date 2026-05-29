import { NextRequest, NextResponse } from "next/server";

import { FALLBACK_LISTINGS } from "@/src/data/fallback-listings";
import { getListingsByBbox } from "@/src/lib/db/queries";

export const dynamic = "force-static";

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
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ data: FALLBACK_LISTINGS });
    }

    const searchParams = request.nextUrl.searchParams;

    const minLat = parseNumber(searchParams.get("minLat"), "minLat");
    const maxLat = parseNumber(searchParams.get("maxLat"), "maxLat");
    const minLng = parseNumber(searchParams.get("minLng"), "minLng");
    const maxLng = parseNumber(searchParams.get("maxLng"), "maxLng");

    if (minLat === null || maxLat === null || minLng === null || maxLng === null) {
      return NextResponse.json({ error: "Bounding box parameters are required" }, { status: 400 });
    }

    const platformValues = [
      ...searchParams.getAll("platform"),
      ...((searchParams.get("platform") || "").includes(",")
        ? String(searchParams.get("platform"))
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : []),
    ];

    const listings = await getListingsByBbox({
      minLat,
      maxLat,
      minLng,
      maxLng,
      minNightlyPrice: parseNumber(searchParams.get("minNightlyPrice"), "minNightlyPrice") ?? undefined,
      maxNightlyPrice: parseNumber(searchParams.get("maxNightlyPrice"), "maxNightlyPrice") ?? undefined,
      minRating: parseNumber(searchParams.get("minRating"), "minRating") ?? undefined,
      maxGuests: parseNumber(searchParams.get("maxGuests"), "maxGuests") ?? undefined,
      countryCode: searchParams.get("countryCode") ?? undefined,
      platform: platformValues.length ? [...new Set(platformValues)] : undefined,
      queryText: searchParams.get("q") ?? undefined,
      limit: parseNumber(searchParams.get("limit"), "limit") ?? undefined,
      offset: parseNumber(searchParams.get("offset"), "offset") ?? undefined,
    });

    return NextResponse.json({ data: listings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
