import axios from "axios";
import { parse } from "csv-parse/sync";

import { FetchListingsParams, RawShortTermRentalListing, ShortTermRentalConnector } from "@/src/types/ingestion";

interface OpenDataRecord {
  id?: string;
  name?: string;
  listing_url?: string;
  description?: string;
  neighbourhood?: string;
  city?: string;
  country_code?: string;
  latitude?: string;
  longitude?: string;
  price?: string;
  room_type?: string;
  accommodates?: string;
  bedrooms?: string;
  bathrooms_text?: string;
  number_of_reviews?: string;
  review_scores_rating?: string;
}

export class OpenDataCityConnector implements ShortTermRentalConnector {
  public readonly name = "OpenDataCityConnector";

  private readonly datasetUrl =
    process.env.OPEN_DATA_CITY_DATASET_URL ??
    "https://data.insideairbnb.com/france/ile-de-france/paris/2024-03-16/visualisations/listings.csv";

  async fetchListings(params: FetchListingsParams): Promise<RawShortTermRentalListing[]> {
    void params;
    const response = await axios.get<string>(this.datasetUrl, {
      responseType: "text",
      timeout: 30000,
    });

    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
    }) as OpenDataRecord[];

    const mappedRecords: Array<RawShortTermRentalListing | null> = records.map((record) => {
        const latitude = Number(record.latitude);
        const longitude = Number(record.longitude);
        const nightlyPrice = Number((record.price ?? "").replace(/[^0-9.-]/g, ""));

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(nightlyPrice)) {
          return null;
        }

        const bathroomsText = record.bathrooms_text ?? "1";
        const bathroomMatch = bathroomsText.match(/[0-9]+(\.[0-9]+)?/);

        return {
          title: record.name || "Short-term rental listing",
          description: (record.description || "Public open-data imported listing").slice(0, 500),
          nightlyPrice,
          currency: "EUR",
          platform: "CityOpenData",
          rating: record.review_scores_rating ? Number(record.review_scores_rating) / 20 : undefined,
          reviewCount: record.number_of_reviews ? Number(record.number_of_reviews) : undefined,
          maxGuests: Number(record.accommodates ?? 1),
          bedrooms: Number(record.bedrooms ?? 1),
          bathrooms: bathroomMatch ? Number(bathroomMatch[0]) : 1,
          propertyType: record.room_type ?? "entire_home",
          latitude,
          longitude,
          city: record.city ?? record.neighbourhood ?? "Unknown City",
          countryCode: (record.country_code ?? "FR").toUpperCase(),
          address: record.neighbourhood,
          originalUrl: record.listing_url ?? "https://insideairbnb.com/get-the-data/",
          sourceListingId: record.id ?? `${latitude}-${longitude}`,
          provider: this.name,
        };
      });

    return mappedRecords.filter((record): record is RawShortTermRentalListing => record !== null);
  }
}
