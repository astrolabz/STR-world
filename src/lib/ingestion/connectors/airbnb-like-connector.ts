import { FetchListingsParams, RawShortTermRentalListing, ShortTermRentalConnector } from "@/src/types/ingestion";

export class AirbnbLikeConnector implements ShortTermRentalConnector {
  public readonly name = "AirbnbLikeConnector";

  async fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]> {
    void params;
    // TODO: Integrare solo API ufficiali Airbnb o provider autorizzati, evitando scraping diretto HTML.
    // TODO: Inserire qui endpoint ufficiale Airbnb, chiave API e mapping campi quando disponibili.
    return [];
  }
}
