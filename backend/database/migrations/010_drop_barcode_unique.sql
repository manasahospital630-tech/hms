-- Drop the unique constraint on barcode in sample_collections
ALTER TABLE sample_collections DROP CONSTRAINT IF EXISTS sample_collections_barcode_key;
