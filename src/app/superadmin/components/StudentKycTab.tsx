import { CheckCircle2, Search, UserCheck, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { StudentKycApplication } from '../types';

interface StudentKycTabProps {
  filteredStudentApps: StudentKycApplication[];
  studentSearch: string;
  setStudentSearch: (s: string) => void;
  studentStatusFilter: string;
  setStudentStatusFilter: (s: string) => void;
  reviewStudent: (id: string, status: 'approved' | 'rejected') => void;
  handleRevokeStudent: (id: string) => void;
  handleUnrevokeStudent: (id: string) => void;
}

export function StudentKycTab({
  filteredStudentApps,
  studentSearch,
  setStudentSearch,
  studentStatusFilter,
  setStudentStatusFilter,
  reviewStudent,
  handleRevokeStudent,
  handleUnrevokeStudent,
}: StudentKycTabProps) {
  return (
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
  );
}
