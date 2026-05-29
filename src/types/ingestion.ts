export interface FetchListingsParams {
  updatedAfter?: Date;
  countryCode?: string;
  city?: string;
}

export interface RawShortTermRentalListing {
  title: string;
  description: string;
  nightlyPrice: number;
  currency: string;
  platform: string;
  rating?: number;
  reviewCount?: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  countryCode: string;
  originalUrl: string;
  sourceListingId: string;
  provider: string;
}

export interface ShortTermRentalConnector {
  name: string;
  fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]>;
}
