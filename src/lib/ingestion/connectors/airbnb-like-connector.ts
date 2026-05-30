import { fetchExternalListingsAdapter } from "@/src/lib/ingestion/connectors/external-listings-adapter";
import { FetchListingsParams, RawShortTermRentalListing, ShortTermRentalConnector } from "@/src/types/ingestion";

export class AirbnbLikeConnector implements ShortTermRentalConnector {
  public readonly name = "AirbnbLikeConnector";

  private readonly endpoint = process.env.AIRBNB_SCRAPER_API_URL;
  private readonly apiKey = process.env.AIRBNB_SCRAPER_API_KEY;

  async fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]> {
    return fetchExternalListingsAdapter({
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      fallbackPlatform: "Airbnb",
      provider: this.name,
      filters: params,
    });
  }
}
