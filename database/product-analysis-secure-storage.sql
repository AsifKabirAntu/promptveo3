-- =============================================
-- Secure Storage Setup for Product Analysis
-- (Private bucket with user-specific access)
-- =============================================

-- Step 1: Create a PRIVATE bucket (not public)
-- You need to create this manually in Supabase Dashboard:
-- 1. Go to Storage > Buckets
-- 2. Click "New Bucket"
-- 3. Name: "product-images"
-- 4. Public: NO (unchecked) - This is important for security!
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp

-- Step 2: Create the bucket programmatically if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  false,  -- PRIVATE bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Secure RLS Policies for Private Access
-- =============================================

-- Note: These policies should be created in the Supabase Dashboard
-- under Storage > product-images > Policies

-- Policy 1: Users can upload their own images
-- Target: INSERT operations
-- Policy Name: "Users can upload their own images"
-- SQL:
-- bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 2: Users can view their own images  
-- Target: SELECT operations
-- Policy Name: "Users can view their own images"
-- SQL:
-- bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 3: Users can delete their own images
-- Target: DELETE operations  
-- Policy Name: "Users can delete their own images"
-- SQL:
-- bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]

-- =============================================
-- Alternative: Simple authenticated-only policies
-- =============================================

-- If the folder-based approach doesn't work, use these simpler policies:

-- Policy: "Authenticated users can manage images"
-- Target: ALL operations
-- SQL:
-- bucket_id = 'product-images' AND auth.role() = 'authenticated'

-- =============================================
-- How the secure file structure works:
-- =============================================

-- Files will be stored with user ID in the path:
-- /product-images/{user-id}/filename.jpg
-- /product-images/{user-id}/another-file.png

-- This ensures:
-- 1. Each user can only access their own files
-- 2. Files are organized by user
-- 3. No public access to any images
-- 4. Secure URLs are generated for authorized access

-- =============================================
-- Verification
-- =============================================
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images'; 