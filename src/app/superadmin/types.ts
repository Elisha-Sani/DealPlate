export interface StudentKycApplication {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  university: string;
  reg_number: string;
  student_id_file_name: string;
  university_doc_file_name: string;
  university_doc_date: string;
  ai_recommendation: string;
  ai_confidence: number;
  ai_summary: string | null;
  ai_flags: string[] | null;
  status: string;
  created_at: string;
}

export interface VendorApplication {
  id: string;
  auth_user_id: string | null;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  campus_proximity: string;
  status: string;
  created_at: string;
}

export type { SupportTicket, SupportUserRole, SupportTicketStatus, SupportTicketCategory } from '@/types/support';

