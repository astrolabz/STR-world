import { FetchListingsParams, RawShortTermRentalListing, ShortTermRentalConnector } from "@/src/types/ingestion";

export class BookingLikeConnector implements ShortTermRentalConnector {
  public readonly name = "BookingLikeConnector";

  async fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]> {
    void params;
    // TODO: Integrare solo API ufficiali Booking/VRBO o provider legalmente autorizzati.
    // TODO: Inserire qui URL, credenziali e parametri dell'integrazione approvata.
    return [];
  }
}
