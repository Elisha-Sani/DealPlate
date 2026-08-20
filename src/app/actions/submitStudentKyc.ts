'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { validateStudentKyc } from './validateStudentKyc';
import { randomUUID as uuidv4 } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function validateFile(file: File | null, label: string) {
  if (!file) {
    throw new Error(`${label} is required.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${label} exceeds the 5MB size limit.`);
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`${label} must be a JPEG, PNG, or PDF file. Rejected type: ${file.type}`);
  }
}

async function uploadFileToStorage(file: File, bucket: string, path: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error(`Storage upload error for ${path}:`, error);
    throw new Error(`Failed to upload ${file.name} to storage.`);
  }

  return data.path;
}

export async function submitStudentKyc(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('You must be signed in to submit KYC documents.');
    }

    // Never trust a client-supplied studentId — always use the authenticated session's own id.
    const studentId = user.id;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const university = formData.get('university') as string;
    const regNumber = formData.get('regNumber') as string;
    const documentDate = formData.get('documentDate') as string;

    const studentIdFile = formData.get('studentIdFile') as File | null;
    const universityDocFile = formData.get('universityDocFile') as File | null;

    if (!studentId || !university || !regNumber) {
      throw new Error('Missing required user information.');
    }

    // 1. Server-side validation
    validateFile(studentIdFile, 'Student ID card');
    validateFile(universityDocFile, 'University document');

    // Convert files to base64 for Gemini
    const studentIdBuffer = Buffer.from(await studentIdFile!.arrayBuffer());
    const studentIdBase64 = studentIdBuffer.toString('base64');
    
    const universityDocBuffer = Buffer.from(await universityDocFile!.arrayBuffer());
    const universityDocBase64 = universityDocBuffer.toString('base64');

    // 2. Validate using Gemini (Prompt Injection Mitigations applied in validateStudentKyc)
    const aiReview = await validateStudentKyc({
      fullName,
      university,
      regNumber,
      documentDate,
      documents: [
        {
          label: 'student_id',
          fileName: studentIdFile!.name,
          mimeType: studentIdFile!.type,
          base64: studentIdBase64,
        },
        {
          label: 'university_document',
          fileName: universityDocFile!.name,
          mimeType: universityDocFile!.type,
          base64: universityDocBase64,
        },
      ],
    });

    // 3. Upload to Supabase Storage Bucket
    // Sanitize the client-supplied file name — strip path separators/traversal
    // segments so it can't escape the per-student storage prefix.
    const sanitizeFileName = (name: string) => name.replace(/[/\\]/g, '_').replace(/\.\./g, '_');
    const studentIdPath = `${studentId}/${uuidv4()}-${sanitizeFileName(studentIdFile!.name)}`;
    const universityDocPath = `${studentId}/${uuidv4()}-${sanitizeFileName(universityDocFile!.name)}`;

    const uploadedStudentIdPath = await uploadFileToStorage(studentIdFile!, 'kyc_documents', studentIdPath);
    const uploadedUniversityDocPath = await uploadFileToStorage(universityDocFile!, 'kyc_documents', universityDocPath);

    // 4. Update Profile
    const { error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .update({
        university,
        reg_number: regNumber,
        is_verified: false,
      })
      .eq('id', studentId);

    if (profileError) {
      throw new Error('Failed to update student profile: ' + profileError.message);
    }

    // 5. Insert KYC Application
    const { error: insertError } = await supabaseAdmin
      .from('student_kyc_applications')
      .insert({
        student_id: studentId,
        full_name: fullName,
        email,
        phone,
        university,
        reg_number: regNumber,
        student_id_file_name: studentIdFile!.name,
        university_doc_file_name: universityDocFile!.name,
        university_doc_date: documentDate,
        student_id_url: uploadedStudentIdPath,
        university_doc_url: uploadedUniversityDocPath,
        ai_recommendation: aiReview.recommendation,
        ai_confidence: aiReview.confidence,
        ai_summary: aiReview.summary,
        ai_flags: aiReview.flags,
        status: 'pending_review',
      });

    if (insertError) {
      throw new Error('Failed to insert KYC application: ' + insertError.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error('submitStudentKyc Error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred during KYC submission.' };
  }
}
