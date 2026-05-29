import axios from "axios";

import { FetchListingsParams, RawShortTermRentalListing, ShortTermRentalConnector } from "@/src/types/ingestion";

interface AnalyticsProviderRecord {
  id: string;
  title: string;
  summary: string;
  nightlyPrice: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  latitude: number;
  longitude: number;
  city: string;
  countryCode: string;
  address?: string;
  originalUrl: string;
}

export class AnalyticsProviderConnector implements ShortTermRentalConnector {
  public readonly name = "AnalyticsProviderConnector";

  private readonly providerUrl = process.env.ANALYTICS_PROVIDER_API_URL;
  private readonly apiKey = process.env.ANALYTICS_PROVIDER_API_KEY;

  async fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]> {
    void params;
    if (!this.providerUrl || !this.apiKey) {
      return [
        {
          title: "Mock analytics listing",
          description: "Mock listing from analytics provider",
          nightlyPrice: 120,
          currency: "EUR",
          platform: "AnalyticsProvider",
          rating: 4.7,
          reviewCount: 32,
          maxGuests: 3,
          bedrooms: 1,
          bathrooms: 1,
          propertyType: "private_room",
          latitude: 45.4642,
          longitude: 9.19,
          city: "Milan",
          countryCode: "IT",
          originalUrl: "https://example-provider.test/listings/mock-1",
          sourceListingId: "mock-analytics-1",
          provider: this.name,
        },
      ];
    }

    const response = await axios.get<{ data: AnalyticsProviderRecord[] }>(this.providerUrl, {
      headers: {
        // TODO: Inserire qui la chiave API reale del provider autorizzato.
        Authorization: this.apiKey,
      },
      timeout: 30000,
    });

    return response.data.data.map((record) => ({
      title: record.title,
      description: record.summary,
      nightlyPrice: record.nightlyPrice,
      currency: record.currency,
      platform: "AnalyticsProvider",
      rating: record.rating,
      reviewCount: record.reviewCount,
      maxGuests: record.maxGuests,
      bedrooms: record.bedrooms,
      bathrooms: record.bathrooms,
      propertyType: record.propertyType,
      latitude: record.latitude,
      longitude: record.longitude,
      city: record.city,
      countryCode: record.countryCode,
      address: record.address,
      originalUrl: record.originalUrl,
      sourceListingId: record.id,
      provider: this.name,
    }));
  }
}
