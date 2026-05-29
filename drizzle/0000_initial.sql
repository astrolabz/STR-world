CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS listing_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT,
  type TEXT NOT NULL,
  api_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS short_term_rental_listings (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  nightly_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  platform TEXT NOT NULL,
  rating NUMERIC(3,2),
  review_count INTEGER,
  max_guests INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  property_type TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_point geometry(POINT, 4326) NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  original_url TEXT NOT NULL,
  source_listing_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT short_term_rental_unique_source UNIQUE (source_listing_id, platform)
);

CREATE INDEX IF NOT EXISTS short_term_rental_location_point_gix ON short_term_rental_listings USING GIST (location_point);
CREATE INDEX IF NOT EXISTS short_term_rental_country_platform_idx ON short_term_rental_listings (country_code, platform);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
