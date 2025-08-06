-- =============================================
-- Simple Storage Setup for Product Analysis
-- (Run this in Supabase SQL Editor)
-- =============================================

-- First, create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage > Buckets
-- 2. Click "New Bucket"
-- 3. Name: "product-images"
-- 4. Public: true
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp

-- Then run this SQL to create the bucket programmatically if it doesn't exist:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Alternative: Manual Bucket Creation Steps
-- =============================================

-- If the above doesn't work, please:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Storage > Buckets
-- 3. Click "New Bucket"
-- 4. Fill in these settings:
--    - Name: product-images
--    - Public: Yes (checked)
--    - File size limit: 10 MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
-- 5. Click "Create Bucket"

-- =============================================
-- Verification
-- =============================================
-- Run this to check if the bucket was created:
SELECT * FROM storage.buckets WHERE id = 'product-images'; 