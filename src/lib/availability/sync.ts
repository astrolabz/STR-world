import { createHash } from "node:crypto";

import { getConfiguredIcalSyncFeeds } from "@/src/lib/availability/config";
import { replaceAvailabilityBlocksForFeed } from "@/src/lib/db/queries";
import { ICalSyncFeedConfig, ListingAvailabilityBlockInput } from "@/src/types/availability";

function toDate(value: Date | null | undefined) {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}

function buildSourceEventId(uid: string | undefined, startsAt: Date) {
  return `${uid ?? "event"}:${startsAt.toISOString()}`;
}

function extractSummary(summary: unknown) {
  if (typeof summary === "string") {
    return summary.trim() || undefined;
  }

  if (
    summary &&
    typeof summary === "object" &&
    "val" in summary &&
    typeof summary.val === "string"
  ) {
    return summary.val.trim() || undefined;
  }

  return undefined;
}

function normalizeEventBlock(
  event: { uid?: string; summary?: unknown; start?: Date; end?: Date },
  isAllDay: boolean,
): ListingAvailabilityBlockInput | null {
  const startsAt = toDate(event.start);

  if (!startsAt) {
    return null;
  }

  const endsAt =
    toDate(event.end) ??
    new Date(startsAt.getTime() + (isAllDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));

  if (endsAt <= startsAt) {
    return null;
  }

  return {
    sourceEventId: buildSourceEventId(event.uid, startsAt),
    summary: extractSummary(event.summary),
    startsAt,
    endsAt,
    isAllDay,
  };
}

function hashFeedUrl(url: string) {
  return createHash("sha256").update(url).digest("hex");
}

async function fetchAvailabilityBlocks(feed: ICalSyncFeedConfig) {
  const { default: nodeIcal } = await import("node-ical");
  const calendar = await nodeIcal.async.fromURL(feed.url);
  const blocks: ListingAvailabilityBlockInput[] = [];

  for (const component of Object.values(calendar)) {
    if (!component || component.type !== "VEVENT") {
      continue;
    }

    const block = normalizeEventBlock(
      component,
      Boolean((component.start as Date & { dateOnly?: boolean } | undefined)?.dateOnly),
    );

    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

export async function syncConfiguredCalendarFeeds() {
  const feeds = getConfiguredIcalSyncFeeds();
  const results = [];

  for (const feed of feeds) {
    const blocks = await fetchAvailabilityBlocks(feed);
    await replaceAvailabilityBlocksForFeed({
      listingPlatform: feed.listingPlatform,
      sourceListingId: feed.sourceListingId,
      feedProvider: feed.feedProvider,
      feedUrlHash: hashFeedUrl(feed.url),
      blocks,
    });

    results.push({
      listingPlatform: feed.listingPlatform,
      sourceListingId: feed.sourceListingId,
      feedProvider: feed.feedProvider,
      importedBlocks: blocks.length,
    });
  }

  return {
    configuredFeeds: feeds.length,
    syncedFeeds: results.length,
    results,
  };
}
