import { randomUUID } from "node:crypto";

import { getDbPool } from "@/src/lib/db/client";
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

  if (filters.propertyType) {
    addCondition("property_type = ?", filters.propertyType);
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

export interface ListingsStats {
  totalCount: number;
  avgNightlyPrice: number;
  minNightlyPrice: number;
  maxNightlyPrice: number;
  avgRating: number;
  byPropertyType: { propertyType: string; count: number }[];
  byPlatform: { platform: string; count: number }[];
  topCities: { city: string; countryCode: string; count: number }[];
}

export async function getListingsStats(bbox: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): Promise<ListingsStats> {
  const dbPool = getDbPool();
  const bboxValues = [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat];
  const bboxCondition = `ST_Intersects(location_point, ST_MakeEnvelope($1, $2, $3, $4, 4326))`;

  const [aggregateResult, byPropertyTypeResult, byPlatformResult, topCitiesResult] = await Promise.all([
    dbPool.query(
      `
        SELECT
          COUNT(*)::int AS total_count,
          COALESCE(AVG(nightly_price), 0)::numeric(10,2) AS avg_nightly_price,
          COALESCE(MIN(nightly_price), 0)::numeric(10,2) AS min_nightly_price,
          COALESCE(MAX(nightly_price), 0)::numeric(10,2) AS max_nightly_price,
          COALESCE(AVG(rating), 0)::numeric(3,2) AS avg_rating
        FROM short_term_rental_listings
        WHERE ${bboxCondition}
      `,
      bboxValues,
    ),
    dbPool.query(
      `
        SELECT property_type, COUNT(*)::int AS count
        FROM short_term_rental_listings
        WHERE ${bboxCondition}
        GROUP BY property_type
        ORDER BY count DESC
        LIMIT 10
      `,
      bboxValues,
    ),
    dbPool.query(
      `
        SELECT platform, COUNT(*)::int AS count
        FROM short_term_rental_listings
        WHERE ${bboxCondition}
        GROUP BY platform
        ORDER BY count DESC
      `,
      bboxValues,
    ),
    dbPool.query(
      `
        SELECT city, country_code, COUNT(*)::int AS count
        FROM short_term_rental_listings
        WHERE ${bboxCondition}
        GROUP BY city, country_code
        ORDER BY count DESC
        LIMIT 10
      `,
      bboxValues,
    ),
  ]);

  const agg = aggregateResult.rows[0] ?? {};

  return {
    totalCount: Number(agg.total_count ?? 0),
    avgNightlyPrice: Number(agg.avg_nightly_price ?? 0),
    minNightlyPrice: Number(agg.min_nightly_price ?? 0),
    maxNightlyPrice: Number(agg.max_nightly_price ?? 0),
    avgRating: Number(agg.avg_rating ?? 0),
    byPropertyType: byPropertyTypeResult.rows.map((row) => ({
      propertyType: String(row.property_type),
      count: Number(row.count),
    })),
    byPlatform: byPlatformResult.rows.map((row) => ({
      platform: String(row.platform),
      count: Number(row.count),
    })),
    topCities: topCitiesResult.rows.map((row) => ({
      city: String(row.city),
      countryCode: String(row.country_code),
      count: Number(row.count),
    })),
  };
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
