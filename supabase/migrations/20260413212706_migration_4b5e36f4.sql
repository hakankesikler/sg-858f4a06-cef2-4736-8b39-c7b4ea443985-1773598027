-- Restore currency and status columns that are needed by other modules
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY';
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'beklemede';