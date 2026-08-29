'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

export interface AdminOverviewStats {
  totalStudents: number;
  verifiedStudents: number;
  revokedStudents: number;
  pendingKycReviews: number;
  totalVendors: number;
  approvedVendors: number;
  revokedVendors: number;
  pendingVendorApplications: number;
  activeOrders: number;
  completedOrders: number;
  openSupportTickets: number;
}

async function count(
  table: string,
  filters: Record<string, string | boolean | number>
): Promise<number> {
  let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { count: total, error } = await query;
  if (error) {
    console.error(`[adminGetOverview] count(${table}) failed:`, error.message);
    return 0;
  }
  return total ?? 0;
}

export async function adminGetOverview(): Promise<{ success: boolean; stats?: AdminOverviewStats; error?: string }> {
  try {
    await requireSuperadmin();

    const [
      totalStudents,
      verifiedStudents,
      revokedStudents,
      pendingKycReviews,
      totalVendors,
      approvedVendors,
      revokedVendors,
      pendingVendorApplications,
      activeOrders,
      completedOrders,
      openSupportTickets,
    ] = await Promise.all([
      count('student_profiles', {}),
      count('student_profiles', { is_verified: true }),
      count('student_kyc_applications', { status: 'revoked' }),
      count('student_kyc_applications', { status: 'pending_review' }),
      count('vendors', {}),
      count('vendors', { status: 'approved' }),
      count('vendors', { status: 'revoked' }),
      count('vendor_applications', { status: 'pending_review' }),
      count('orders', { status: 'Active' }),
      count('orders', { status: 'Completed' }),
      count('support_tickets', { status: 'open' }),
    ]);

    return {
      success: true,
      stats: {
        totalStudents,
        verifiedStudents,
        revokedStudents,
        pendingKycReviews,
        totalVendors,
        approvedVendors,
        revokedVendors,
        pendingVendorApplications,
        activeOrders,
        completedOrders,
        openSupportTickets,
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load overview stats.' };
  }
}
