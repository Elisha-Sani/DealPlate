import { createClient } from "@/lib/supabase/server";
import SuperadminClient from "./SuperadminClient";

export default async function SuperadminPage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const isSuperadmin = session?.user?.app_metadata?.role === 'superadmin';

    if (!isSuperadmin) {
        return (
            <SuperadminClient 
                initialStudentApps={[]}
                initialVendorApps={[]}
                initialDeals={[]}
                initialAuditLog={[]}
                initialOverviewStats={{ totalStudents: 0, pendingStudents: 0, totalVendors: 0, pendingVendors: 0, activeDeals: 0 }}
                isUnlocked={false}
            />
        );
    }

    const [{ data: students }, { data: vendors }, overview, dealsResult, auditResult] = await Promise.all([
        supabase.from('student_kyc_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('vendor_applications').select('*').order('created_at', { ascending: false }),
        import('@/app/actions/adminGetOverview').then((m) => m.adminGetOverview()),
        import('@/app/actions/adminGetDeals').then((m) => m.adminGetDeals()),
        import('@/app/actions/adminGetAuditLog').then((m) => m.adminGetAuditLog()),
    ]);

    return (
        <SuperadminClient
            initialStudentApps={students || []}
            initialVendorApps={vendors || []}
            initialOverviewStats={overview.success ? overview.stats! : { totalStudents: 0, pendingStudents: 0, totalVendors: 0, pendingVendors: 0, activeDeals: 0 }}
            initialDeals={dealsResult.success ? dealsResult.deals! : []}
            initialAuditLog={auditResult.success ? auditResult.actions! : []}
            isUnlocked={true}
        />
    );
}
