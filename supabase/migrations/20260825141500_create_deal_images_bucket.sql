-- Create the storage bucket for deal images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deal-images', 'deal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to deal-images
CREATE POLICY "Give public access to deal-images" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'deal-images' );

-- Allow authenticated vendors to upload deal images
CREATE POLICY "Allow vendors to insert deal-images" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'deal-images' AND auth.uid() IS NOT NULL );

-- Allow vendors to update and delete their own deal images
CREATE POLICY "Allow vendors to update their deal-images" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'deal-images' AND auth.uid() = owner );

CREATE POLICY "Allow vendors to delete their deal-images" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'deal-images' AND auth.uid() = owner );
