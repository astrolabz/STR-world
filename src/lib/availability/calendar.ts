import { getAvailabilityBlocksForListing, getListingBySource } from "@/src/lib/db/queries";

export async function buildListingAvailabilityCalendar(listingPlatform: string, sourceListingId: string) {
  const { default: ical } = await import("ical-generator");
  const [listing, blocks] = await Promise.all([
    getListingBySource(listingPlatform, sourceListingId),
    getAvailabilityBlocksForListing(listingPlatform, sourceListingId),
  ]);

  const calendarName = listing?.title || `Availability ${listingPlatform} ${sourceListingId}`;

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
