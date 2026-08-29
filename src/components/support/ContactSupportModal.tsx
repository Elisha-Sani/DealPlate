'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Headphones,
  User,
  Mail,
  HelpCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { submitSupportTicket } from '@/app/actions/submitSupportTicket';
import type { SupportTicketCategory, SupportUserRole } from '@/types/support';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: SupportUserRole;
  userName?: string;
  userEmail?: string;
  defaultCategory?: SupportTicketCategory;
  defaultSubject?: string;
}

const STUDENT_CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: 'general', label: 'General Question' },
  { value: 'order_issue', label: 'Order / Meal Pickup Issue' },
  { value: 'payment_mpesa', label: 'Payment & M-Pesa Query' },
  { value: 'account_verification', label: 'Student Verification & University' },
  { value: 'technical_bug', label: 'Technical Bug or App Issue' },
  { value: 'other', label: 'Other' },
];

const VENDOR_CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'listing_inventory', label: 'Listing & Deals Management' },
  { value: 'order_issue', label: 'Customer Order / Pickup Issue' },
  { value: 'payment_mpesa', label: 'Payouts & Financial Settlement' },
  { value: 'account_verification', label: 'Business Profile & Account Details' },
  { value: 'technical_bug', label: 'Technical Bug or App Issue' },
  { value: 'other', label: 'Other' },
];

export default function ContactSupportModal({
  isOpen,
  onClose,
  userRole,
  userName = '',
  userEmail = '',
  defaultCategory = 'general',
  defaultSubject = '',
}: ContactSupportModalProps) {
  const [category, setCategory] = useState<SupportTicketCategory>(defaultCategory);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories = userRole === 'vendor' ? VENDOR_CATEGORIES : STUDENT_CATEGORIES;

  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim() || subject.trim().length < 3) {
      setErrorMessage('Please provide a subject with at least 3 characters.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Please provide details for your request (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitSupportTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit support request.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setSubject('');
      setMessage('');
      setCategory('general');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 relative"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-support-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 text-[#FF6B00]">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="contact-support-title" className="font-display font-extrabold text-xl tracking-tight">
                    Contact Support
                  </h2>
                  <p className="text-xs text-gray-300">
                    We&apos;re here to help! Send us your query or feedback.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Badge */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-200">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold">{userName || 'Signed-in User'}</span>
                {userEmail && (
                  <>
                    <span className="text-gray-500">&bull;</span>
                    <span className="text-gray-300 truncate max-w-[180px]">{userEmail}</span>
                  </>
                )}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  userRole === 'vendor'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-[#FF6B00]/20 text-orange-200 border border-[#FF6B00]/30'
                }`}
              >
                {userRole === 'vendor' ? 'Vendor Account' : 'Student Account'}
              </span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">Message Received!</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Thank you for reaching out. Our support team has logged your ticket and will review it promptly.
                  </p>
                </div>
                <div className="pt-4 w-full flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setSubject('');
                      setMessage('');
                    }}
                    className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Send Another Query
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-bold rounded-xl hover:bg-[#e66000] shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#FF6B00]" />
                    Topic / Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 font-medium focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition-all cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF6B00]" />
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your inquiry..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={150}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Message Details
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {message.length}/5000
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue, question, or request with as much detail as possible..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={5000}
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition-all placeholder:text-gray-400 resize-none font-normal leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                    className="h-11 px-6 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] flex items-center gap-2 shadow-sm shadow-[#FF6B00]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
