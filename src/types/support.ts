export type SupportUserRole = 'student' | 'vendor';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportTicketCategory =
  | 'general'
  | 'order_issue'
  | 'payment_mpesa'
  | 'account_verification'
  | 'listing_inventory'
  | 'technical_bug'
  | 'other';

export interface SupportTicket {
  id: string;
  user_id: string | null;
  user_role: SupportUserRole;
  user_name: string;
  user_email: string;
  subject: string;
  category: SupportTicketCategory;
  message: string;
  status: SupportTicketStatus;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
