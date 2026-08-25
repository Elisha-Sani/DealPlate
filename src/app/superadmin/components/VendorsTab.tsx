import { CheckCircle2, Search, Store, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { VendorApplication } from '../types';

interface VendorsTabProps {
  filteredVendorApps: VendorApplication[];
  vendorSearch: string;
  setVendorSearch: (s: string) => void;
  vendorStatusFilter: string;
  setVendorStatusFilter: (s: string) => void;
  reviewVendor: (id: string, status: 'approved' | 'rejected') => void;
  handleRevokeVendor: (authId: string, id: string) => void;
  handleUnrevokeVendor: (authId: string, id: string) => void;
}

export function VendorsTab({
  filteredVendorApps,
  vendorSearch,
  setVendorSearch,
  vendorStatusFilter,
  setVendorStatusFilter,
  reviewVendor,
  handleRevokeVendor,
  handleUnrevokeVendor,
}: VendorsTabProps) {
  return (
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
  );
}
