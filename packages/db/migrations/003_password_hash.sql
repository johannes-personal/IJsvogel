-- Add password_hash column to users (nullable so existing rows are unaffected)
alter table users add column if not exists password_hash text;

-- Mark used_at accessible (already in schema but ensure column exists for token consumption)
alter table password_reset_tokens add column if not exists used_at timestamptz;
