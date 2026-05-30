import { z } from "zod";

import { ICalSyncFeedConfig } from "@/src/types/availability";

const icalSyncFeedSchema = z.object({
  listingPlatform: z.string().trim().min(1),
  sourceListingId: z.string().trim().min(1),
  feedProvider: z.string().trim().min(1).default("iCal"),
  url: z.string().url(),
  calendarName: z.string().trim().min(1).optional(),
});

export function getConfiguredIcalSyncFeeds(): ICalSyncFeedConfig[] {
  const rawConfig = process.env.ICAL_SYNC_FEEDS;

  if (!rawConfig) {
    return [];
  }

  const parsed = z.array(icalSyncFeedSchema).parse(JSON.parse(rawConfig));

  return parsed.map((feed) => ({
    listingPlatform: feed.listingPlatform,
    sourceListingId: feed.sourceListingId,
    feedProvider: feed.feedProvider,
    url: feed.url,
    calendarName: feed.calendarName,
  }));
}
