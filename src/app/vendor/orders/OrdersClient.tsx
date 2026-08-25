'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, LayoutDashboard, Loader2 } from 'lucide-react';
import VendorTopBar from '@/components/layout/VendorTopBar';
import OrderQueueTable from '@/components/vendor/OrderQueueTable';
import { supabase } from '@/lib/supabase/client';
import type { PendingPaymentRow } from '@/app/actions/vendorPayments';
import type { Order, Deal } from '@/types';

function PendingPaymentsPanel({ onConfirmed }: { onConfirmed: () => void }) {
  const [payments, setPayments] = useState<PendingPaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [receiptDrafts, setReceiptDrafts] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    const { vendorGetPendingPayments } = await import('@/app/actions/vendorPayments');
    const result = await vendorGetPendingPayments();
    setPayments(result.success ? result.payments || [] : []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();

    const mpesaChannel = supabase
      .channel('vendor_mpesa_payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpesa_payments' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(mpesaChannel);
    };
  }, [load]);

  const handleConfirm = async (paymentId: string) => {
    const receipt = receiptDrafts[paymentId]?.trim();
    if (!receipt) {
      setMessage({ text: 'Enter the M-Pesa confirmation code first.', type: 'error' });
      return;
    }
    setConfirmingId(paymentId);
    setMessage(null);
    const { vendorConfirmPayment } = await import('@/app/actions/vendorPayments');
    const result = await vendorConfirmPayment(paymentId, receipt);
    setConfirmingId(null);
    if (result.success) {
      setMessage({ text: 'Payment confirmed — order created.', type: 'success' });
      await load();
      onConfirmed();
    } else {
      setMessage({ text: result.error || 'Could not confirm payment.', type: 'error' });
    }
  };

  if (isLoading || payments.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 space-y-4">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-amber-900">Awaiting payment confirmation</h3>
          <p className="text-xs text-amber-700 mt-0.5">
            These payments haven&apos;t been confirmed automatically yet. If a student shows you a completed M-Pesa
            payment on their phone that matches one below, enter the confirmation code to manually approve it.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg p-2.5 text-xs font-semibold ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-lg border border-amber-100 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1E293B] truncate">{payment.deal_title}</p>
              <p className="text-xs text-gray-500">
                Ksh {payment.amount} &bull; {payment.phone} &bull; {new Date(payment.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <input
                value={receiptDrafts[payment.id] || ''}
                onChange={(e) => setReceiptDrafts((prev) => ({ ...prev, [payment.id]: e.target.value }))}
                placeholder="M-Pesa code"
                className="h-9 w-32 px-3 rounded-lg border border-gray-200 text-xs font-mono outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
              <button
                onClick={() => handleConfirm(payment.id)}
                disabled={confirmingId === payment.id}
                className="h-9 px-3 rounded-lg bg-green-600 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1 hover:bg-green-700"
              >
                {confirmingId === payment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useRouter } from 'next/navigation';

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const fetchOrders = useCallback(async () => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    fetchOrders();

    const ordersChannel = supabase
      .channel('vendor_orders_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchOrders]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1">
      <VendorTopBar title="Live Order Queue" />
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500">Manage and verify upfront-paid student orders for collection.</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-semibold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              Live Sync Active
            </div>
            <button 
              onClick={fetchOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <PendingPaymentsPanel onConfirmed={fetchOrders} />
        <OrderQueueTable orders={orders} />
      </div>
    </motion.div>
  );
}
