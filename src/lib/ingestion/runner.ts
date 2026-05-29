import {
  createIngestionJob,
  markIngestionJobFailed,
  markIngestionJobSuccess,
  upsertShortTermRentalListing,
} from "@/src/lib/db/queries";
import { normalizeRawListing } from "@/src/lib/ingestion/normalizer";
import { ShortTermRentalConnector } from "@/src/types/ingestion";

export class IngestionRunner {
  constructor(private readonly connectors: ShortTermRentalConnector[]) {}

  async run() {
    const jobId = await createIngestionJob(this.connectors.map((connector) => connector.name).join(","));

    try {
      for (const connector of this.connectors) {
        const rawListings = await connector.fetchListings({});

        for (const rawListing of rawListings) {
          const listing = normalizeRawListing(rawListing);
          await upsertShortTermRentalListing({
            ...listing,
            lastSeenAt: new Date(),
          });
        }
      }

      await markIngestionJobSuccess(jobId);
      return { jobId, status: "success" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown ingestion error";
      await markIngestionJobFailed(jobId, message);
      return { jobId, status: "failed" as const, error: message };
    }
  }
}
