-- =============================================
-- Storage Bucket Policies for Product Analysis
-- =============================================

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies for the product-images bucket
-- Policy for SELECT (viewing images)
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Policy for INSERT (uploading images)  
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Policy for UPDATE (updating image metadata)
CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for DELETE (deleting images)
CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Alternative: If the above folder-based policies don't work, use these simpler ones:
-- Uncomment these and comment out the above if needed

-- CREATE POLICY "Authenticated users can manage product images" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'product-images' 
--     AND auth.role() = 'authenticated'
--   );

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- =============================================
-- Verification Query
-- =============================================
-- Run this to verify the bucket and policies were created:
-- SELECT * FROM storage.buckets WHERE id = 'product-images';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'; 