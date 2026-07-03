'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ClipboardCheck, Loader2, ShieldCheck, Store, UserCheck, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { reviewVendorApplicationSecure } from '@/app/actions/reviewVendorApplication';

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
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  campus_proximity: string;
  status: string;
  created_at: string;
}

const SUPERADMIN_CODE = process.env.NEXT_PUBLIC_SUPERADMIN_CODE || 'dealplate-admin';

export default function SuperadminDashboard() {
  const [code, setCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [studentApps, setStudentApps] = useState<StudentKycApplication[]>([]);
  const [vendorApps, setVendorApps] = useState<VendorApplication[]>([]);

  const loadApplications = async () => {
    setIsLoading(true);
    const [{ data: students }, { data: vendors }] = await Promise.all([
      supabase
        .from('student_kyc_applications')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);
    setStudentApps((students || []) as StudentKycApplication[]);
    setVendorApps((vendors || []) as VendorApplication[]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isUnlocked) loadApplications();
  }, [isUnlocked]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== SUPERADMIN_CODE) {
      setMessage('Invalid superadmin code.');
      return;
    }
    setMessage('');
    setIsUnlocked(true);
  };

  const reviewStudent = async (id: string, status: 'approved' | 'rejected') => {
    setMessage('Reviewing student KYC...');
    const { error } = await supabase.rpc('review_student_kyc_application', {
      p_application_id: id,
      p_status: status,
      p_admin_notes: status === 'approved' ? 'Approved from superadmin dashboard.' : 'Rejected from superadmin dashboard.',
    });
    setMessage(error ? error.message : `Student KYC ${status}.`);
    await loadApplications();
  };

  const reviewVendor = async (id: string, status: 'approved' | 'rejected') => {
    setMessage(status === 'approved' ? 'Creating vendor login and profile...' : 'Rejecting vendor application...');
    const result = await reviewVendorApplicationSecure(
      id,
      status,
      status === 'approved' ? 'Approved from superadmin dashboard.' : 'Rejected from superadmin dashboard.'
    );
    setMessage(result.success ? `Vendor application ${status}.` : (result.error || 'Vendor review failed.'));
    await loadApplications();
  };

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <form onSubmit={unlock} className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#1E293B] text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Superadmin</h1>
          <p className="text-sm text-gray-500 mb-5">Enter the dashboard code to review KYC and vendor onboarding queues.</p>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Superadmin code"
            className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm mb-4"
          />
          {message && <p className="text-sm text-red-600 mb-4">{message}</p>}
          <button type="submit" className="w-full h-11 rounded-lg bg-[#FF6B00] text-white font-bold hover:bg-[#e66000]">
            Unlock Dashboard
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#1E293B] p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Superadmin Dashboard</h1>
            <p className="text-sm text-gray-500">Approve student KYC and onboard verified vendors.</p>
          </div>
          <button onClick={loadApplications} className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {message && <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 text-sm font-semibold text-[#FF6B00]">{message}</div>}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#FF6B00]" />
              <h2 className="font-bold text-lg">Student KYC</h2>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {studentApps.length === 0 ? <p className="p-5 text-sm text-gray-500">No student KYC applications.</p> : studentApps.map((app) => (
                <article key={app.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{app.full_name}</h3>
                      <p className="text-xs text-gray-500">{app.university} &bull; {app.reg_number}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-gray-100 text-gray-600">{app.status}</span>
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
                </article>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-2">
              <Store className="w-5 h-5 text-[#FF6B00]" />
              <h2 className="font-bold text-lg">Vendor Onboarding</h2>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {vendorApps.length === 0 ? <p className="p-5 text-sm text-gray-500">No vendor applications.</p> : vendorApps.map((app) => (
                <article key={app.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{app.business_name}</h3>
                      <p className="text-xs text-gray-500">{app.email} &bull; {app.phone}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-gray-100 text-gray-600">{app.status}</span>
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
                </article>
              ))}
            </div>
          </div>
        </section>
      </motion.div>
    </main>
  );
}

