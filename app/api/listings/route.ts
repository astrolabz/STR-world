import { NextRequest, NextResponse } from "next/server";

import { getListingsByBbox } from "@/src/lib/db/queries";
import { ShortTermRentalListing } from "@/src/types/listings";

export const dynamic = "force-static";

const FALLBACK_LISTINGS: ShortTermRentalListing[] = [
  {
    id: "fallback-1",
    title: "Loft panoramico a Roma",
    description: "Loft centrale con vista sulla città.",
    nightlyPrice: 130,
    currency: "EUR",
    platform: "CityOpenData",
    rating: 4.7,
    reviewCount: 128,
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Loft",
    latitude: 41.9028,
    longitude: 12.4964,
    address: "Centro storico",
    city: "Rome",
    countryCode: "IT",
    originalUrl: "https://example.com/listing/fallback-1",
    sourceListingId: "fallback-1",
    provider: "fallback",
    lastSeenAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fallback-2",
    title: "Appartamento vista mare a Barcellona",
    description: "Bilocale vicino alla spiaggia.",
    nightlyPrice: 160,
    currency: "EUR",
    platform: "AnalyticsProvider",
    rating: 4.8,
    reviewCount: 204,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: "Apartment",
    latitude: 41.3851,
    longitude: 2.1734,
    address: "Barceloneta",
    city: "Barcelona",
    countryCode: "ES",
    originalUrl: "https://example.com/listing/fallback-2",
    sourceListingId: "fallback-2",
    provider: "fallback",
    lastSeenAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

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
