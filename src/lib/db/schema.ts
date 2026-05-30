import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const shortTermRentalListingsTable = pgTable("short_term_rental_listings", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  nightlyPrice: numeric("nightly_price").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  platform: text("platform").notNull(),
  rating: numeric("rating"),
  reviewCount: integer("review_count"),
  maxGuests: integer("max_guests").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  propertyType: text("property_type").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  address: text("address"),
  city: text("city").notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  originalUrl: text("original_url").notNull(),
  sourceListingId: text("source_listing_id").notNull(),
  provider: text("provider").notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const listingSourcesTable = pgTable("listing_sources", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url"),
  type: text("type").notNull(),
  apiType: text("api_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const ingestionJobsTable = pgTable("ingestion_jobs", {
  id: uuid("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const listingAvailabilityBlocksTable = pgTable("listing_availability_blocks", {
  id: uuid("id").primaryKey(),
  listingPlatform: text("listing_platform").notNull(),
  sourceListingId: text("source_listing_id").notNull(),
  feedProvider: text("feed_provider").notNull(),
  feedUrlHash: text("feed_url_hash").notNull(),
  sourceEventId: text("source_event_id").notNull(),
  summary: text("summary"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  isAllDay: boolean("is_all_day").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
