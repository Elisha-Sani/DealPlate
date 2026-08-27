'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, ShieldCheck, Smartphone, Store, Lock } from 'lucide-react';
import { useCart } from '@/providers/CartProvider';
import { useUser } from '@/providers/UserProvider';
import Price from '@/components/ui/Price';
import MpesaCheckout from '@/components/checkout/MpesaCheckout';
import { SERVICE_FEE } from '@/lib/constants';

export default function StudentCheckout() {
  const router = useRouter();
  const { cartDeal, mpesaPhone, setMpesaPhone, clearCart } = useCart();
  const { updateStats } = useUser();
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!cartDeal) {
      router.push('/student/explore');
    }
  }, [cartDeal, router]);

  if (!cartDeal) {
    return null;
  }

  const total = cartDeal.dealPrice + SERVICE_FEE;

  const handlePaymentSuccess = (orderId: string) => {
    // The order itself is created server-side by the M-Pesa callback once
    // Safaricom confirms payment — by the time we get here it already
    // exists, so this just reflects that in the UI and moves on.
    setIsPaying(false);
    updateStats(cartDeal.originalPrice - cartDeal.dealPrice);
    clearCart();
    router.push(`/student/orders/${orderId}?confirmed=1`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-5xl w-full mx-auto flex flex-col gap-6 px-4 md:px-0 pb-10"
    >
      <div>
        <Link
          href="/student/explore"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue browsing</span>
        </Link>
        <h2 className="font-display font-extrabold text-4xl tracking-tight text-[#111827] mb-2 leading-tight">Checkout</h2>
        <p className="text-[#5a4136] text-base">Review your flash deal and complete secure mobile payment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Item + Payment */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm flex gap-5 items-center">
            <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative bg-gray-100 border">
              <Image src={cartDeal.image} alt={cartDeal.title} fill sizes="112px" className="object-cover" />
              <div className="absolute top-0 left-0 bg-[#E11D48] text-white text-xs font-black px-2.5 py-1 rounded-br-lg">
                -{cartDeal.discountPercentage}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-xl text-[#111827] leading-tight truncate mb-2">{cartDeal.title}</h3>
              <div className="flex items-center gap-1.5 text-sm text-[#5a4136] mb-1.5">
                <Store className="w-4 h-4 text-[#FF6B00] shrink-0" />
                <span className="truncate">{cartDeal.vendor}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Pickup from {cartDeal.timeStart}</span>
              </div>
            </div>
            <Price amount={cartDeal.dealPrice} size="lg" className="shrink-0" />
          </div>

          <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="w-9 h-9 rounded-lg bg-[#26B24B]/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#26B24B]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#111827] leading-tight">Payment Method</h3>
                <p className="text-xs text-gray-400">M-Pesa via Safaricom Daraja</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2 ml-1">M-Pesa Registered Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-sm font-bold text-gray-400">+254</span>
                </div>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="7XX XXX XXX"
                  className="w-full h-14 pl-16 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-base text-[#111827] font-semibold outline-none focus:ring-2 focus:ring-[#FF6B00] focus:bg-white transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2.5 ml-1">We&apos;ll send an automated Safaricom STK Push prompt to this handset.</p>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm space-y-5 sticky top-24">
            <h3 className="font-display font-extrabold text-lg text-[#111827]">Order Summary</h3>
            <div className="space-y-3 text-sm border-b border-gray-100 pb-4">
              <div className="flex justify-between text-[#5a4136]">
                <span>Flash Deal Price</span>
                <Price amount={cartDeal.dealPrice} size="sm" />
              </div>
              <div className="flex justify-between text-[#5a4136]">
                <span>Merchant Service Fee</span>
                <Price amount={SERVICE_FEE} size="sm" />
              </div>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-base font-bold text-[#111827]">Grand Total</span>
              <Price amount={total} size="xl" className="text-[#FF6B00]" />
            </div>
            <button
              type="button"
              onClick={() => setIsPaying(true)}
              className="w-full h-14 bg-[#26B24B] hover:bg-[#209c40] text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 duration-100 shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Pay Ksh {total} with M-Pesa</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#26B24B]" />
              <span>Secured by Safaricom Daraja &bull; No cash accepted on pickup</span>
            </div>
          </div>
        </div>
      </div>

      {isPaying && (
        <MpesaCheckout
          dealId={cartDeal.id}
          amount={total}
          phoneNumber={`+254 ${mpesaPhone}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setIsPaying(false)}
        />
      )}
    </motion.div>
  );
}
