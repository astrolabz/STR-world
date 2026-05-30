import axios from "axios";

import { FetchListingsParams, RawShortTermRentalListing } from "@/src/types/ingestion";

interface ExternalScraperListingRecord {
  id: string;
  title: string;
  description?: string;
  nightlyPrice: number;
  currency?: string;
  platform?: string;
  rating?: number;
  reviewCount?: number;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  countryCode: string;
  originalUrl: string;
}

function mapRecord(
  record: ExternalScraperListingRecord,
  fallbackPlatform: string,
  provider: string,
): RawShortTermRentalListing {
  return {
    title: record.title,
    description: record.description ?? `${fallbackPlatform} listing imported from external scraper adapter`,
    nightlyPrice: record.nightlyPrice,
    currency: record.currency ?? "EUR",
    platform: record.platform ?? fallbackPlatform,
    rating: record.rating,
    reviewCount: record.reviewCount,
    maxGuests: record.maxGuests ?? 1,
    bedrooms: record.bedrooms ?? 0,
    bathrooms: record.bathrooms ?? 1,
    propertyType: record.propertyType ?? "entire_home",
    latitude: record.latitude,
    longitude: record.longitude,
    address: record.address,
    city: record.city,
    countryCode: record.countryCode,
    originalUrl: record.originalUrl,
    sourceListingId: record.id,
    provider,
  };
}

export async function fetchExternalListingsAdapter(params: {
  endpoint: string | undefined;
  apiKey?: string;
  fallbackPlatform: string;
  provider: string;
  filters: FetchListingsParams;
}) {
  const { endpoint, apiKey, fallbackPlatform, provider, filters } = params;

  if (!endpoint) {
    return [];
  }

  const response = await axios.get<{ data?: ExternalScraperListingRecord[] } | ExternalScraperListingRecord[]>(
    endpoint,
    {
      headers: apiKey ? { Authorization: apiKey } : undefined,
      params: {
        updatedAfter: filters.updatedAfter?.toISOString(),
        countryCode: filters.countryCode,
        city: filters.city,
      },
      timeout: 30000,
    },
  );

  const records = Array.isArray(response.data) ? response.data : response.data.data ?? [];

  return records.map((record) => mapRecord(record, fallbackPlatform, provider));
}
