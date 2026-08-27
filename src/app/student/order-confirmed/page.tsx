'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, QrCode, ShieldAlert } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import Price from '@/components/ui/Price';
import Timer from '@/components/ui/Timer';

export default function StudentOrderConfirmed() {
  const router = useRouter();
  const { activeOrder, ticketSeconds } = useOrders();

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 font-medium mb-4">No active order found.</p>
        <Link href="/student/explore" className="text-[#FF6B00] font-bold hover:underline">
          Browse Deals
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full mx-auto flex flex-col gap-5 py-2"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-md animate-bounce">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="font-display font-black text-2xl tracking-tight text-[#111827]">Order Confirmed!</h2>
        <p className="text-[#5a4136] text-sm leading-relaxed max-w-xs mx-auto">
          Your flash meal deal has been secured at campus merchant gateway.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg flex flex-col">
        <div className="bg-[#FFF8F6] border-b border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-widest font-black text-gray-400 mb-2">PICKUP CODE</span>
          <div className="bg-white border-2 border-[#FF6B00] font-mono text-3xl font-black text-[#111827] px-6 py-3 rounded-xl tracking-widest mb-4 shadow-sm animate-pulse">
            {activeOrder.pickupCode}
          </div>
          <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-inner mb-2">
            <QrCode className="w-24 h-24 text-[#111827]" />
          </div>
          <span className="text-xs font-semibold text-[#5a4136]">Show this QR code to the cashier</span>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest font-black text-gray-400 mb-2 block">PICKUP WINDOW LIMIT</span>
            <Timer initialSeconds={ticketSeconds} variant="box" />
          </div>

          <p className="text-xs text-[#E11D48] text-center font-semibold bg-red-50 p-3 rounded-lg flex items-center gap-1.5 justify-center">
            <ShieldAlert className="w-4 h-4" />
            <span>Hurry! Your food might be released if window expires.</span>
          </p>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-black text-[#5a4136]">Item details</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#5a4136] font-medium">{activeOrder.deal.title}</span>
              <Price amount={activeOrder.deal.dealPrice} size="sm" />
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
              <span>Service Handshake Fee</span>
              <span>Ksh 20</span>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/student/explore"
        className="w-full h-12 border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/5 font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm bg-white"
      >
        <span>Back to Deal Feed</span>
      </Link>
    </motion.div>
  );
}
