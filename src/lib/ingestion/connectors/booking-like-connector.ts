import { fetchExternalListingsAdapter } from "@/src/lib/ingestion/connectors/external-listings-adapter";
import { FetchListingsParams, RawShortTermRentalListing, ShortTermRentalConnector } from "@/src/types/ingestion";

export class BookingLikeConnector implements ShortTermRentalConnector {
  public readonly name = "BookingLikeConnector";

  private readonly endpoint = process.env.BOOKING_SCRAPER_API_URL;
  private readonly apiKey = process.env.BOOKING_SCRAPER_API_KEY;

  async fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]> {
    return fetchExternalListingsAdapter({
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      fallbackPlatform: "Booking",
      provider: this.name,
      filters: params,
    });
  }
}
