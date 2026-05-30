export interface ListingAvailabilityBlock {
  id: string;
  listingPlatform: string;
  sourceListingId: string;
  feedProvider: string;
  feedUrlHash: string;
  sourceEventId: string;
  summary?: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingAvailabilityBlockInput {
  sourceEventId: string;
  summary?: string;
  startsAt: Date;
  endsAt: Date;
  isAllDay: boolean;
}

export interface ICalSyncFeedConfig {
  listingPlatform: string;
  sourceListingId: string;
  feedProvider: string;
  url: string;
  calendarName?: string;
}
