export interface ShortTermRentalListing {
  id: string;
  title: string;
  description: string;
  nightlyPrice: number;
  currency: string;
  platform: string;
  rating?: number | null;
  reviewCount?: number | null;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  city: string;
  countryCode: string;
  originalUrl: string;
  sourceListingId: string;
  provider: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingSource {
  id: string;
  name: string;
  baseUrl?: string | null;
  type: string;
  apiType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionJob {
  id: string;
  source: string;
  status: "running" | "success" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ListingsQueryFilters {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  minNightlyPrice?: number;
  maxNightlyPrice?: number;
  minRating?: number;
  maxGuests?: number;
  countryCode?: string;
  platform?: string[];
  queryText?: string;
  limit?: number;
  offset?: number;
}
