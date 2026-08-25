import type { AdminOverviewStats } from '@/app/actions/adminGetOverview';

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent || 'text-[#1E293B]'}`}>{value}</p>
    </div>
  );
}

export function OverviewTab({ overviewStats }: { overviewStats: AdminOverviewStats | null }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard label="Students" value={overviewStats?.totalStudents ?? 0} />
      <StatCard label="Verified Students" value={overviewStats?.verifiedStudents ?? 0} accent="text-green-600" />
      <StatCard label="Pending KYC" value={overviewStats?.pendingKycReviews ?? 0} accent="text-amber-600" />
      <StatCard label="Revoked Students" value={overviewStats?.revokedStudents ?? 0} accent="text-red-600" />
      <StatCard label="Vendors" value={overviewStats?.totalVendors ?? 0} />
      <StatCard label="Approved Vendors" value={overviewStats?.approvedVendors ?? 0} accent="text-green-600" />
      <StatCard label="Pending Vendor Apps" value={overviewStats?.pendingVendorApplications ?? 0} accent="text-amber-600" />
      <StatCard label="Revoked Vendors" value={overviewStats?.revokedVendors ?? 0} accent="text-red-600" />
      <StatCard label="Active Orders" value={overviewStats?.activeOrders ?? 0} />
      <StatCard label="Completed Orders" value={overviewStats?.completedOrders ?? 0} accent="text-green-600" />
    </section>
  );
}
