import { randomUUID } from "node:crypto";

import { getDbPool } from "@/src/lib/db/client";
import { ListingAvailabilityBlock, ListingAvailabilityBlockInput } from "@/src/types/availability";
import { ListingsQueryFilters, ShortTermRentalListing } from "@/src/types/listings";

const MAX_LISTINGS_LIMIT = 500;
const DEFAULT_LISTINGS_LIMIT = 250;

interface UpsertListingInput {
  title: string;
  description: string;
  nightlyPrice: number;
  currency: string;
  platform: string;
  rating?: number;
  reviewCount?: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  countryCode: string;
  originalUrl: string;
  sourceListingId: string;
  provider: string;
  lastSeenAt: Date;
}

interface ReplaceAvailabilityBlocksForFeedInput {
  listingPlatform: string;
  sourceListingId: string;
  feedProvider: string;
  feedUrlHash: string;
  blocks: ListingAvailabilityBlockInput[];
}

function mapRow(row: Record<string, unknown>): ShortTermRentalListing {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    nightlyPrice: Number(row.nightly_price),
    currency: String(row.currency),
    platform: String(row.platform),
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: row.review_count === null ? null : Number(row.review_count),
    maxGuests: Number(row.max_guests),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    propertyType: String(row.property_type),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address ? String(row.address) : null,
    city: String(row.city),
    countryCode: String(row.country_code),
    originalUrl: String(row.original_url),
    sourceListingId: String(row.source_listing_id),
    provider: String(row.provider),
    lastSeenAt: String(row.last_seen_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapAvailabilityRow(row: Record<string, unknown>): ListingAvailabilityBlock {
  return {
    id: String(row.id),
    listingPlatform: String(row.listing_platform),
    sourceListingId: String(row.source_listing_id),
    feedProvider: String(row.feed_provider),
    feedUrlHash: String(row.feed_url_hash),
    sourceEventId: String(row.source_event_id),
    summary: row.summary ? String(row.summary) : null,
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    isAllDay: Boolean(row.is_all_day),
    lastSyncedAt: String(row.last_synced_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertShortTermRentalListing(input: UpsertListingInput) {
  const dbPool = getDbPool();
  const id = randomUUID();

  await dbPool.query(
    `
      INSERT INTO short_term_rental_listings (
        id, title, description, nightly_price, currency, platform, rating, review_count,
        max_guests, bedrooms, bathrooms, property_type, latitude, longitude, location_point,
        address, city, country_code, original_url, source_listing_id, provider, last_seen_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, ST_SetSRID(ST_MakePoint($14, $13), 4326),
        $15, $16, $17, $18, $19, $20, $21,
        NOW(), NOW()
      )
      ON CONFLICT (source_listing_id, platform)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        nightly_price = EXCLUDED.nightly_price,
        currency = EXCLUDED.currency,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        max_guests = EXCLUDED.max_guests,
        bedrooms = EXCLUDED.bedrooms,
        bathrooms = EXCLUDED.bathrooms,
        property_type = EXCLUDED.property_type,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location_point = EXCLUDED.location_point,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        country_code = EXCLUDED.country_code,
        original_url = EXCLUDED.original_url,
        provider = EXCLUDED.provider,
        last_seen_at = EXCLUDED.last_seen_at,
        updated_at = NOW()
    `,
    [
      id,
      input.title,
      input.description,
      input.nightlyPrice,
      input.currency,
      input.platform,
      input.rating ?? null,
      input.reviewCount ?? null,
      input.maxGuests,
      input.bedrooms,
      input.bathrooms,
      input.propertyType,
      input.latitude,
      input.longitude,
      input.address ?? null,
      input.city,
      input.countryCode,
      input.originalUrl,
      input.sourceListingId,
      input.provider,
      input.lastSeenAt,
    ],
  );
}

export async function getListingsByBbox(filters: ListingsQueryFilters) {
  const dbPool = getDbPool();
  const values: unknown[] = [filters.minLng, filters.minLat, filters.maxLng, filters.maxLat];
  const conditions = [
    `ST_Intersects(location_point, ST_MakeEnvelope($1, $2, $3, $4, 4326))`,
  ];

  const addCondition = (condition: string, value: unknown) => {
    values.push(value);
    conditions.push(condition.replace("?", `$${values.length}`));
  };

  if (typeof filters.minNightlyPrice === "number") {
    addCondition("nightly_price >= ?", filters.minNightlyPrice);
  }

  if (typeof filters.maxNightlyPrice === "number") {
    addCondition("nightly_price <= ?", filters.maxNightlyPrice);
  }

  if (typeof filters.minRating === "number") {
    addCondition("rating >= ?", filters.minRating);
  }

  if (typeof filters.maxGuests === "number") {
    addCondition("max_guests >= ?", filters.maxGuests);
  }

  if (filters.countryCode) {
    addCondition("country_code = ?", filters.countryCode.toUpperCase());
  }

  if (filters.queryText) {
    const text = `%${filters.queryText.toLowerCase()}%`;
    values.push(text, text);
    conditions.push(`(LOWER(city) LIKE $${values.length - 1} OR LOWER(title) LIKE $${values.length})`);
  }

  if (filters.platform?.length) {
    values.push(filters.platform);
    conditions.push(`platform = ANY($${values.length}::text[])`);
  }

  const limit =
    filters.limit && filters.limit > 0
      ? Math.min(filters.limit, MAX_LISTINGS_LIMIT)
      : DEFAULT_LISTINGS_LIMIT;
  const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;
  values.push(limit, offset);

  const result = await dbPool.query(
    `
      SELECT
        id, title, description, nightly_price, currency, platform, rating, review_count,
        max_guests, bedrooms, bathrooms, property_type, latitude, longitude,
        address, city, country_code, original_url, source_listing_id, provider,
        last_seen_at, created_at, updated_at
      FROM short_term_rental_listings
      WHERE ${conditions.join(" AND ")}
      ORDER BY updated_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `,
    values,
  );

  return result.rows.map(mapRow);
}

export async function getListingById(id: string) {
  const dbPool = getDbPool();
  const result = await dbPool.query(
    `
      SELECT
        id, title, description, nightly_price, currency, platform, rating, review_count,
        max_guests, bedrooms, bathrooms, property_type, latitude, longitude,
        address, city, country_code, original_url, source_listing_id, provider,
        last_seen_at, created_at, updated_at
      FROM short_term_rental_listings
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function getListingBySource(platform: string, sourceListingId: string) {
  const dbPool = getDbPool();
  const result = await dbPool.query(
    `
      SELECT
        id, title, description, nightly_price, currency, platform, rating, review_count,
        max_guests, bedrooms, bathrooms, property_type, latitude, longitude,
        address, city, country_code, original_url, source_listing_id, provider,
        last_seen_at, created_at, updated_at
      FROM short_term_rental_listings
      WHERE platform = $1 AND source_listing_id = $2
      LIMIT 1
    `,
    [platform, sourceListingId],
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function createIngestionJob(source: string) {
  const dbPool = getDbPool();
  const id = randomUUID();
  const result = await dbPool.query(
    `
      INSERT INTO ingestion_jobs (id, source, status, started_at, created_at)
      VALUES ($1, $2, 'running', NOW(), NOW())
      RETURNING id
    `,
    [id, source],
  );

  return String(result.rows[0].id);
}

export async function markIngestionJobSuccess(id: string) {
  const dbPool = getDbPool();
  await dbPool.query(
    `
      UPDATE ingestion_jobs
      SET status = 'success', finished_at = NOW()
      WHERE id = $1
    `,
    [id],
  );
}

export async function markIngestionJobFailed(id: string, errorMessage: string) {
  const dbPool = getDbPool();
  await dbPool.query(
    `
      UPDATE ingestion_jobs
      SET status = 'failed', finished_at = NOW(), error_message = $2
      WHERE id = $1
    `,
    [id, errorMessage],
  );
}

export async function getIngestionJobs(limit = 50) {
  const dbPool = getDbPool();
  const result = await dbPool.query(
    `
      SELECT id, source, status, started_at, finished_at, error_message, created_at
      FROM ingestion_jobs
      ORDER BY started_at DESC
      LIMIT $1
    `,
    [Math.min(Math.max(limit, 1), 200)],
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    source: String(row.source),
    status: String(row.status),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAt: String(row.created_at),
  }));
}

export async function replaceAvailabilityBlocksForFeed(input: ReplaceAvailabilityBlocksForFeedInput) {
  const dbPool = getDbPool();
  const client = await dbPool.connect();
  const syncedAt = new Date();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        DELETE FROM listing_availability_blocks
        WHERE listing_platform = $1
          AND source_listing_id = $2
          AND feed_provider = $3
          AND feed_url_hash = $4
      `,
      [input.listingPlatform, input.sourceListingId, input.feedProvider, input.feedUrlHash],
    );

    if (input.blocks.length > 0) {
      const values: unknown[] = [];
      const placeholders = input.blocks.map((block, index) => {
        const offset = index * 11;
        values.push(
          randomUUID(),
          input.listingPlatform,
          input.sourceListingId,
          input.feedProvider,
          input.feedUrlHash,
          block.sourceEventId,
          block.summary ?? null,
          block.startsAt,
          block.endsAt,
          block.isAllDay,
          syncedAt,
        );

        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, NOW(), NOW())`;
      });

      await client.query(
        `
          INSERT INTO listing_availability_blocks (
            id, listing_platform, source_listing_id, feed_provider, feed_url_hash,
            source_event_id, summary, starts_at, ends_at, is_all_day, last_synced_at,
            created_at, updated_at
          ) VALUES ${placeholders.join(",")}
        `,
        values,
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAvailabilityBlocksForListing(listingPlatform: string, sourceListingId: string) {
  const dbPool = getDbPool();
  const result = await dbPool.query(
    `
      SELECT
        id, listing_platform, source_listing_id, feed_provider, feed_url_hash,
        source_event_id, summary, starts_at, ends_at, is_all_day, last_synced_at,
        created_at, updated_at
      FROM listing_availability_blocks
      WHERE listing_platform = $1
        AND source_listing_id = $2
      ORDER BY starts_at ASC
    `,
    [listingPlatform, sourceListingId],
  );

  return result.rows.map(mapAvailabilityRow);
}
