import { RawShortTermRentalListing } from "@/src/types/ingestion";

const MAX_DESCRIPTION_LENGTH = 1000;

export function normalizeRawListing(raw: RawShortTermRentalListing): RawShortTermRentalListing {
  return {
    ...raw,
    title: raw.title.trim(),
    description: raw.description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
    currency: raw.currency.toUpperCase(),
    countryCode: raw.countryCode.toUpperCase(),
    maxGuests: Math.max(1, Math.round(raw.maxGuests)),
    bedrooms: Math.max(0, Math.round(raw.bedrooms)),
    bathrooms: Math.max(0, Math.round(raw.bathrooms)),
    nightlyPrice: Number(raw.nightlyPrice.toFixed(2)),
  };
}
