'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Loader2,
  Package,
  ScrollText,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { reviewVendorApplicationSecure } from '@/app/actions/reviewVendorApplication';
import type { AdminOverviewStats } from '@/app/actions/adminGetOverview';
import type { AdminDealRow } from '@/app/actions/adminGetDeals';
import type { AdminActionRow } from '@/app/actions/adminGetAuditLog';

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  revoked: 'bg-red-100 text-red-800',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent || 'text-[#1E293B]'}`}>{value}</p>
    </div>
  );
}

interface StudentKycApplication {
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

interface VendorApplication {
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

type Tab = 'overview' | 'students' | 'vendors' | 'deals' | 'audit';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Overview', icon: ClipboardCheck },
  { id: 'students', label: 'Student KYC', icon: UserCheck },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'deals', label: 'Deals', icon: Package },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
];

export default function SuperadminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const setStatusMessage = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const [studentApps, setStudentApps] = useState<StudentKycApplication[]>([]);
  const [vendorApps, setVendorApps] = useState<VendorApplication[]>([]);
  const [deals, setDeals] = useState<AdminDealRow[]>([]);
  const [auditLog, setAuditLog] = useState<AdminActionRow[]>([]);
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('all');
  const [dealSearch, setDealSearch] = useState('');

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    isReasonRequired: boolean;
    onConfirm: (reason: string) => Promise<void>;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');

  const loadAll = async () => {
    setIsLoading(true);
    const [{ data: students }, { data: vendors }, overview, dealsResult, auditResult] = await Promise.all([
      supabase.from('student_kyc_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('vendor_applications').select('*').order('created_at', { ascending: false }),
      import('@/app/actions/adminGetOverview').then((m) => m.adminGetOverview()),
      import('@/app/actions/adminGetDeals').then((m) => m.adminGetDeals()),
      import('@/app/actions/adminGetAuditLog').then((m) => m.adminGetAuditLog()),
    ]);
    setStudentApps((students || []) as StudentKycApplication[]);
    setVendorApps((vendors || []) as VendorApplication[]);
    setOverviewStats(overview.success ? overview.stats! : null);
    setDeals(dealsResult.success ? dealsResult.deals! : []);
    setAuditLog(auditResult.success ? auditResult.actions! : []);
    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdmin(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdmin(session.user);
      } else {
        setIsUnlocked(false);
        setIsSuperadmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = (user: any) => {
    if (user.app_metadata?.role === 'superadmin') {
      setIsSuperadmin(true);
      setIsUnlocked(true);
      loadAll();
    } else {
      setIsSuperadmin(false);
      setIsUnlocked(false);
      setStatusMessage('Your account does not have superadmin privileges.', 'error');
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/superadmin`,
      },
    });
    if (error) {
      setStatusMessage(error.message, 'error');
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const confirmAction = (config: typeof modalConfig) => {
    setModalReason('');
    setModalConfig(config);
  };

  const executeModalAction = async () => {
    if (!modalConfig) return;
    if (modalConfig.isReasonRequired && modalReason.trim() === '') {
      alert("A reason is strictly required.");
      return;
    }
    const action = modalConfig.onConfirm;
    setModalConfig(null);
    await action(modalReason);
  };

  const reviewStudent = (id: string, status: 'approved' | 'rejected') => {
    confirmAction({
      title: status === 'approved' ? 'Approve Student' : 'Reject Student',
      description: `Are you sure you want to ${status} this student's KYC?`,
      actionLabel: status === 'approved' ? 'Approve' : 'Reject',
      isDestructive: status === 'rejected',
      isReasonRequired: false,
      onConfirm: async (reason: string) => {
        setMessage(`Reviewing student KYC...`);
        const { error } = await supabase.rpc('review_student_kyc_application', {
          p_application_id: id,
          p_status: status,
          p_admin_notes: reason || (status === 'approved' ? 'Approved from superadmin dashboard.' : 'Rejected from superadmin dashboard.'),
        });
        setStatusMessage(error ? error.message : `Student KYC ${status}.`, error ? 'error' : 'success');
        await loadAll();
      }
    });
  };

  const reviewVendor = (id: string, status: 'approved' | 'rejected') => {
    confirmAction({
      title: status === 'approved' ? 'Approve Vendor' : 'Reject Vendor',
      description: `Are you sure you want to ${status} this vendor application?`,
      actionLabel: status === 'approved' ? 'Approve' : 'Reject',
      isDestructive: status === 'rejected',
      isReasonRequired: false,
      onConfirm: async (reason: string) => {
        setMessage(status === 'approved' ? 'Creating vendor login and profile...' : 'Rejecting vendor application...');
        const result = await reviewVendorApplicationSecure(
          id,
          status,
          reason || (status === 'approved' ? 'Approved from superadmin dashboard.' : 'Rejected from superadmin dashboard.')
        );
        setStatusMessage(result.success ? `Vendor application ${status}.` : (result.error || 'Vendor review failed.'), result.success ? 'success' : 'error');
        await loadAll();
      }
    });
  };

  const handleRevokeStudent = (studentId: string) => {
    confirmAction({
      title: 'Revoke Student Access',
      description: 'WARNING: This is a destructive action. This will terminate their active sessions and block them from logging in.',
      actionLabel: 'Revoke Access',
      isDestructive: true,
      isReasonRequired: true,
      onConfirm: async (reason: string) => {
        setMessage('Revoking student access globally...');
        const { revokeStudent } = await import('@/app/actions/revokeStudent');
        const result = await revokeStudent(studentId, reason);
        setStatusMessage(result.success ? 'Student revoked successfully.' : (result.error || 'Revoke failed.'), result.success ? 'success' : 'error');
        await loadAll();
      }
    });
  };

  const handleRevokeVendor = (vendorAuthId: string, applicationId: string) => {
    if (!vendorAuthId) {
      alert("Cannot revoke vendor: They haven't set up an account yet.");
      return;
    }
    confirmAction({
      title: 'Revoke Vendor Access',
      description: 'WARNING: This is a destructive action. This will terminate their active sessions and disable their public profile.',
      actionLabel: 'Revoke Access',
      isDestructive: true,
      isReasonRequired: true,
      onConfirm: async (reason: string) => {
        setMessage('Revoking vendor access globally...');
        const { revokeVendor } = await import('@/app/actions/revokeVendor');
        const result = await revokeVendor(vendorAuthId, applicationId, reason);
        setStatusMessage(result.success ? 'Vendor revoked successfully.' : (result.error || 'Revoke failed.'), result.success ? 'success' : 'error');
        await loadAll();
      }
    });
  };

  const handleUnrevokeStudent = (studentId: string) => {
    confirmAction({
      title: 'Reinstate Student Access',
      description: 'This will restore login access and mark the student as verified again.',
      actionLabel: 'Reinstate',
      isDestructive: false,
      isReasonRequired: true,
      onConfirm: async (reason: string) => {
        setMessage('Reinstating student access...');
        const { unrevokeStudent } = await import('@/app/actions/unrevokeStudent');
        const result = await unrevokeStudent(studentId, reason);
        setStatusMessage(result.success ? 'Student reinstated successfully.' : (result.error || 'Reinstate failed.'), result.success ? 'success' : 'error');
        await loadAll();
      }
    });
  };

  const handleUnrevokeVendor = (vendorAuthId: string, applicationId: string) => {
    confirmAction({
      title: 'Reinstate Vendor Access',
      description: 'This will restore login access and re-approve the vendor.',
      actionLabel: 'Reinstate',
      isDestructive: false,
      isReasonRequired: true,
      onConfirm: async (reason: string) => {
        setMessage('Reinstating vendor access...');
        const { unrevokeVendor } = await import('@/app/actions/unrevokeVendor');
        const result = await unrevokeVendor(vendorAuthId, applicationId, reason);
        setStatusMessage(result.success ? 'Vendor reinstated successfully.' : (result.error || 'Reinstate failed.'), result.success ? 'success' : 'error');
        await loadAll();
      }
    });
  };

  const handleToggleDealPublished = async (deal: AdminDealRow) => {
    setMessage(deal.is_published ? 'Unpublishing deal...' : 'Publishing deal...');
    const { adminSetDealPublished } = await import('@/app/actions/adminUpdateDeal');
    const result = await adminSetDealPublished(deal.id, !deal.is_published);
    setStatusMessage(
      result.success ? `Deal ${deal.is_published ? 'unpublished' : 'published'}.` : (result.error || 'Update failed.'),
      result.success ? 'success' : 'error'
    );
    await loadAll();
  };

  const handleDeleteDeal = (deal: AdminDealRow) => {
    confirmAction({
      title: 'Delete Deal',
      description: `Permanently delete "${deal.title}" by ${deal.vendor}? This cannot be undone.`,
      actionLabel: 'Delete',
      isDestructive: true,
      isReasonRequired: true,
      onConfirm: async (reason: string) => {
        setMessage('Deleting deal...');
        const { adminDeleteDeal } = await import('@/app/actions/adminUpdateDeal');
        const result = await adminDeleteDeal(deal.id, reason);
        setStatusMessage(result.success ? 'Deal deleted.' : (result.error || 'Delete failed.'), result.success ? 'success' : 'error');
        await loadAll();
      }
    });
  };

  const filteredStudentApps = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return studentApps.filter((app) => {
      const matchesSearch =
        !q ||
        app.full_name.toLowerCase().includes(q) ||
        (app.email || '').toLowerCase().includes(q) ||
        app.reg_number.toLowerCase().includes(q);
      const matchesStatus = studentStatusFilter === 'all' || app.status === studentStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [studentApps, studentSearch, studentStatusFilter]);

  const filteredVendorApps = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    return vendorApps.filter((app) => {
      const matchesSearch =
        !q ||
        app.business_name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.contact_name.toLowerCase().includes(q);
      const matchesStatus = vendorStatusFilter === 'all' || app.status === vendorStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendorApps, vendorSearch, vendorStatusFilter]);

  const filteredDeals = useMemo(() => {
    const q = dealSearch.trim().toLowerCase();
    return deals.filter(
      (deal) => !q || deal.title.toLowerCase().includes(q) || deal.vendor.toLowerCase().includes(q)
    );
  }, [deals, dealSearch]);

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#1E293B] text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Superadmin</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to access the KYC and vendor queues.</p>

          {session && !isSuperadmin ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600 font-semibold">{message || "Not an admin account."}</p>
              <button onClick={signOut} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-white border border-[#E2E8F0] text-[#1E293B] font-bold hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Sign in with Google
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#1E293B] p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Superadmin Dashboard</h1>
            <p className="text-sm text-gray-500">Approve student KYC, onboard vendors, and moderate the marketplace.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Refresh
            </button>
            <button onClick={signOut} className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
              Sign Out
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm font-semibold border ${
              messageType === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : messageType === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-[#E2E8F0] text-[#FF6B00]'
            }`}
          >
            {message}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-[#1E293B] text-white' : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
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
        )}

        {activeTab === 'students' && (
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="font-bold text-lg">Student KYC</h2>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search name, email, reg no..."
                    className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00] w-64"
                  />
                </div>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00]"
                >
                  <option value="all">All statuses</option>
                  <option value="pending_review">Pending review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {filteredStudentApps.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">No matching student KYC applications.</p>
              ) : (
                filteredStudentApps.map((app) => (
                  <article key={app.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{app.full_name}</h3>
                        <p className="text-xs text-gray-500">{app.university} &bull; {app.reg_number}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-600">{app.ai_summary || 'No AI summary.'}</p>
                    <div className="text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <span>ID: {app.student_id_file_name}</span>
                      <span>Doc: {app.university_doc_file_name}</span>
                      <span>Date: {app.university_doc_date}</span>
                      <span>AI: {app.ai_recommendation} ({app.ai_confidence}%)</span>
                    </div>
                    {app.ai_flags && app.ai_flags.length > 0 && (
                      <ul className="text-xs text-[#E11D48] list-disc pl-4">
                        {app.ai_flags.map((flag) => <li key={flag}>{flag}</li>)}
                      </ul>
                    )}
                    {app.status === 'pending_review' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => reviewStudent(app.id, 'approved')} className="h-9 px-3 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => reviewStudent(app.id, 'rejected')} className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleRevokeStudent(app.student_id)} className="h-9 px-3 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Revoke Access
                        </button>
                      </div>
                    )}
                    {app.status === 'revoked' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleUnrevokeStudent(app.student_id)} className="h-9 px-3 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Reinstate Access
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'vendors' && (
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="font-bold text-lg">Vendor Onboarding</h2>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Search business, email, contact..."
                    className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00] w-64"
                  />
                </div>
                <select
                  value={vendorStatusFilter}
                  onChange={(e) => setVendorStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00]"
                >
                  <option value="all">All statuses</option>
                  <option value="pending_review">Pending review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {filteredVendorApps.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">No matching vendor applications.</p>
              ) : (
                filteredVendorApps.map((app) => (
                  <article key={app.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{app.business_name}</h3>
                        <p className="text-xs text-gray-500">{app.email} &bull; {app.phone}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-600">{app.address}</p>
                    <p className="text-xs text-gray-500">Contact: {app.contact_name} &bull; Campus: {app.campus_proximity}</p>
                    {app.status === 'pending_review' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => reviewVendor(app.id, 'approved')} className="h-9 px-3 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => reviewVendor(app.id, 'rejected')} className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleRevokeVendor(app.auth_user_id || '', app.id)} className="h-9 px-3 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Revoke Access
                        </button>
                      </div>
                    )}
                    {app.status === 'revoked' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleUnrevokeVendor(app.auth_user_id || '', app.id)} className="h-9 px-3 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Reinstate Access
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'deals' && (
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="font-bold text-lg">All Deals</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={dealSearch}
                  onChange={(e) => setDealSearch(e.target.value)}
                  placeholder="Search title or vendor..."
                  className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00] w-64"
                />
              </div>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {filteredDeals.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">No matching deals.</p>
              ) : (
                filteredDeals.map((deal) => (
                  <article key={deal.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{deal.title}</h3>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                            deal.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {deal.is_published ? 'Published' : 'Hidden'}
                        </span>
                        {deal.stock_count === 0 && (
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-50 text-red-700">Sold out</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{deal.vendor} &bull; {deal.campus} &bull; Ksh {deal.deal_price} ({deal.stock_count} left)</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleDealPublished(deal)}
                        className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#1E293B] hover:bg-gray-50 flex items-center gap-1"
                      >
                        {deal.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {deal.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal)}
                        className="h-9 px-3 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'audit' && (
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#FF6B00]" />
              <h2 className="font-bold text-lg">Audit Log</h2>
              <span className="text-xs text-gray-400 font-medium">(most recent 200 actions)</span>
            </div>
            <div className="divide-y divide-[#E2E8F0] max-h-[70vh] overflow-y-auto">
              {auditLog.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">No admin actions recorded yet.</p>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between text-sm">
                    <div>
                      <span className="font-bold text-[#1E293B]">{entry.admin_email}</span>
                      <span className="text-gray-500"> {entry.action_type} </span>
                      <span className="text-gray-500">{entry.target_type} ({entry.target_id.slice(0, 8)})</span>
                      {entry.reason && <p className="text-xs text-gray-400 mt-0.5">Reason: {entry.reason}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      {modalConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalConfig(null)}
          onKeyDown={(e) => e.key === 'Escape' && setModalConfig(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 id="modal-title" className="text-xl font-bold text-[#1E293B] mb-2">{modalConfig.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{modalConfig.description}</p>

              <div className="mb-4">
                <label className="block text-sm font-bold text-[#1E293B] mb-1">
                  Reason {modalConfig.isReasonRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                </label>
                <textarea
                  className="w-full border border-[#E2E8F0] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  rows={3}
                  placeholder="Enter notes or reason..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setModalConfig(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={executeModalAction}
                  disabled={modalConfig.isReasonRequired && modalReason.trim() === ''}
                  className={`px-4 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-50 ${modalConfig.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {modalConfig.actionLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
