import { createHash } from "node:crypto";

import ical from "ical-generator";
import nodeIcal from "node-ical";

import { getConfiguredIcalSyncFeeds } from "@/src/lib/availability/config";
import {
  getAvailabilityBlocksForListing,
  getListingBySource,
  replaceAvailabilityBlocksForFeed,
} from "@/src/lib/db/queries";
import { ICalSyncFeedConfig, ListingAvailabilityBlockInput } from "@/src/types/availability";

function toDate(value: Date | null | undefined) {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}

function buildSourceEventId(uid: string | undefined, startsAt: Date) {
  return `${uid ?? "event"}:${startsAt.toISOString()}`;
}

function normalizeEventBlock(
  event: { uid?: string; summary?: string; start?: Date; end?: Date },
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
    summary: event.summary?.trim() || undefined,
    startsAt,
    endsAt,
    isAllDay,
  };
}

function hashFeedUrl(url: string) {
  return createHash("sha256").update(url).digest("hex");
}

async function fetchAvailabilityBlocks(feed: ICalSyncFeedConfig) {
  const calendar = await nodeIcal.async.fromURL(feed.url);
  const blocks: ListingAvailabilityBlockInput[] = [];

  for (const component of Object.values(calendar)) {
    if (!component || component.type !== "VEVENT") {
      continue;
    }

    const block = normalizeEventBlock(component, Boolean(component.start?.dateOnly));

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

export async function buildListingAvailabilityCalendar(listingPlatform: string, sourceListingId: string) {
  const [listing, blocks] = await Promise.all([
    getListingBySource(listingPlatform, sourceListingId),
    getAvailabilityBlocksForListing(listingPlatform, sourceListingId),
  ]);

  const calendarName =
    listing?.title ||
    `Availability ${listingPlatform} ${sourceListingId}`;

  const calendar = ical({
    name: calendarName,
    prodId: {
      company: "STR World",
      product: "STR World",
      language: "EN",
    },
  });

  for (const block of blocks) {
    calendar.createEvent({
      id: block.sourceEventId,
      start: new Date(block.startsAt),
      end: new Date(block.endsAt),
      allDay: block.isAllDay,
      summary: block.summary || `Blocked on ${block.feedProvider}`,
      description: `Synced from ${block.feedProvider} by STR World`,
    });
  }

  return {
    calendarName,
    content: calendar.toString(),
    hasBlocks: blocks.length > 0,
  };
}
