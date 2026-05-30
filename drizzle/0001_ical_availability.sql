CREATE TABLE IF NOT EXISTS listing_availability_blocks (
  id UUID PRIMARY KEY,
  listing_platform TEXT NOT NULL,
  source_listing_id TEXT NOT NULL,
  feed_provider TEXT NOT NULL,
  feed_url_hash TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  summary TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listing_availability_blocks_unique_event UNIQUE (
    listing_platform,
    source_listing_id,
    feed_provider,
    feed_url_hash,
    source_event_id
  )
);

CREATE INDEX IF NOT EXISTS listing_availability_blocks_listing_idx
  ON listing_availability_blocks (listing_platform, source_listing_id, starts_at);
