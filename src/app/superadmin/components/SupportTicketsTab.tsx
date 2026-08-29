'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Headphones,
  Search,
  User,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Send,
  Loader2,
  X,
  Mail,
  HelpCircle,
  FileText,
  Filter,
} from 'lucide-react';
import type { SupportTicket, SupportTicketStatus, SupportUserRole } from '@/types/support';

interface SupportTicketsTabProps {
  tickets: SupportTicket[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  profileFilter: 'all' | 'student' | 'vendor';
  setProfileFilter: (p: 'all' | 'student' | 'vendor') => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onUpdateTicket: (ticketId: string, status: SupportTicketStatus, adminNotes?: string) => Promise<void>;
  isUpdating?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General Question',
  order_issue: 'Order / Pickup Issue',
  payment_mpesa: 'Payment & M-Pesa',
  account_verification: 'Verification & Profile',
  listing_inventory: 'Listing & Inventory',
  technical_bug: 'Technical Bug',
  other: 'Other',
};

export function SupportTicketsTab({
  tickets,
  searchQuery,
  setSearchQuery,
  profileFilter,
  setProfileFilter,
  statusFilter,
  setStatusFilter,
  onUpdateTicket,
  isUpdating = false,
}: SupportTicketsTabProps) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [modalStatus, setModalStatus] = useState<SupportTicketStatus>('open');
  const [modalNotes, setModalNotes] = useState('');
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Compute counts
  const studentCount = tickets.filter((t) => t.user_role === 'student').length;
  const vendorCount = tickets.filter((t) => t.user_role === 'vendor').length;
  const openCount = tickets.filter((t) => t.status === 'open').length;

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Profile filter
    if (profileFilter !== 'all' && ticket.user_role !== profileFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && ticket.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ticket.user_name?.toLowerCase().includes(q);
      const matchEmail = ticket.user_email?.toLowerCase().includes(q);
      const matchSubject = ticket.subject?.toLowerCase().includes(q);
      const matchMessage = ticket.message?.toLowerCase().includes(q);
      const matchCategory = ticket.category?.toLowerCase().includes(q);
      return matchName || matchEmail || matchSubject || matchMessage || matchCategory;
    }

    return true;
  });

  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setModalStatus(ticket.status);
    setModalNotes(ticket.admin_notes || '');
  };

  const handleSaveTicketStatus = async () => {
    if (!selectedTicket) return;
    setIsSavingModal(true);
    try {
      await onUpdateTicket(selectedTicket.id, modalStatus, modalNotes);
      setSelectedTicket((prev) => (prev ? { ...prev, status: modalStatus, admin_notes: modalNotes } : null));
    } finally {
      setIsSavingModal(false);
      setSelectedTicket(null);
    }
  };

  const getStatusBadge = (status: SupportTicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-gray-100 text-gray-600 border border-gray-200">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header & Stats Banner */}
      <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-gray-50 via-white to-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-[#1E293B] tracking-tight">Support Queries</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and resolve inquiries submitted by students and vendors.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 shadow-xs text-xs font-bold">
            <span className="text-gray-400">Total:</span>
            <span className="text-gray-900">{tickets.length}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-800">
            <span>Pending:</span>
            <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">
              {openCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 border-b border-[#E2E8F0] bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Profile Filter Tabs */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setProfileFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              profileFilter === 'all'
                ? 'bg-white text-[#1E293B] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Profiles ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setProfileFilter('student')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              profileFilter === 'student'
                ? 'bg-white text-[#FF6B00] shadow-xs'
                : 'text-gray-500 hover:text-[#FF6B00]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Students ({studentCount})
          </button>
          <button
            type="button"
            onClick={() => setProfileFilter('vendor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              profileFilter === 'vendor'
                ? 'bg-white text-[#1E293B] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Vendors ({vendorCount})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, subject..."
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E2E8F0] text-xs font-medium outline-none focus:ring-2 focus:ring-[#FF6B00] bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E2E8F0] text-xs font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open (Needs Attention)</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="divide-y divide-[#E2E8F0]">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">No support messages found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              No queries match your current filter criteria or search query.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <article
              key={ticket.id}
              onClick={() => openTicketDetail(ticket)}
              className="p-5 hover:bg-gray-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                      ticket.user_role === 'vendor'
                        ? 'bg-slate-800 text-white'
                        : 'bg-[#FF6B00] text-white'
                    }`}
                  >
                    {ticket.user_role === 'vendor' ? (
                      <>
                        <Store className="w-3 h-3" /> Vendor
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3" /> Student
                      </>
                    )}
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600">
                    {CATEGORY_LABELS[ticket.category] || ticket.category}
                  </span>

                  {getStatusBadge(ticket.status)}

                  <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium ml-auto md:ml-0">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-[#FF6B00] transition-colors leading-tight">
                    {ticket.subject}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                    {ticket.message}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-bold text-gray-800">{ticket.user_name}</span>
                  <span>&bull;</span>
                  <a
                    href={`mailto:${ticket.user_email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-[#FF6B00] hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    {ticket.user_email}
                  </a>
                  {ticket.admin_notes && (
                    <>
                      <span>&bull;</span>
                      <span className="text-xs text-blue-600 font-medium truncate max-w-xs">
                        Admin Note: {ticket.admin_notes}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-gray-100 group-hover:bg-[#FF6B00] group-hover:text-white text-gray-700 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <span>Review</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Ticket Detail & Status Update Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedTicket(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedTicket(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      selectedTicket.user_role === 'vendor'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#FF6B00]/20 text-orange-200 border border-[#FF6B00]/30'
                    }`}
                  >
                    {selectedTicket.user_role === 'vendor' ? 'Vendor Query' : 'Student Query'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ID: {selectedTicket.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* User Information Card */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                    Sender Name
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    {selectedTicket.user_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedTicket.user_email}?subject=Re: ${encodeURIComponent(
                      selectedTicket.subject
                    )}`}
                    className="text-[#FF6B00] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {selectedTicket.user_email}
                  </a>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                    Category
                  </span>
                  <span className="font-semibold text-gray-700">
                    {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                    Submitted At
                  </span>
                  <span className="font-semibold text-gray-700">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#FF6B00]" />
                  Message
                </h4>
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-800 font-normal leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Status Update Control */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Update Ticket Status
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['open', 'in_progress', 'resolved', 'closed'] as SupportTicketStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setModalStatus(st)}
                        className={`h-10 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                          modalStatus === st
                            ? st === 'resolved'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : st === 'in_progress'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : st === 'open'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {st === 'in_progress' ? 'In Progress' : st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Internal Admin Resolution Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Admin Resolution Notes (Internal)
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Add notes about actions taken, phone call summary, or resolution details..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <a
                  href={`mailto:${selectedTicket.user_email}?subject=Re: ${encodeURIComponent(
                    selectedTicket.subject
                  )}`}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#FF6B00]" />
                  Reply via Email
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    disabled={isSavingModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTicketStatus}
                    disabled={isSavingModal}
                    className="h-10 px-5 bg-[#1E293B] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingModal ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-[#FF6B00]" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

function Save(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}
