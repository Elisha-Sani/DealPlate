-- Storage buckets and schema updates for KYC and Avatars

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Avatars Bucket RLS (Public read, authenticated user can upload their own)
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar."
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
CREATE POLICY "Users can delete their own avatar."
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = owner);


-- 3. KYC Documents Bucket RLS (Private, only owner and superadmin can read)
DROP POLICY IF EXISTS "Superadmin and owner can view KYC documents" ON storage.objects;
CREATE POLICY "Superadmin and owner can view KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc_documents'
  AND (
    auth.uid() = owner
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
  )
);

-- Inserts into kyc_documents will be done via service_role, so no INSERT policy needed for public.

-- 4. Modify student_kyc_applications schema
ALTER TABLE public.student_kyc_applications
DROP COLUMN IF EXISTS document_data,
ADD COLUMN IF NOT EXISTS student_id_url text,
ADD COLUMN IF NOT EXISTS university_doc_url text;

