'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Smartphone, Lock } from 'lucide-react';
import { useCart } from '@/providers/CartProvider';
import { useUser } from '@/providers/UserProvider';
import { useOrders } from '@/hooks/useOrders';
import Price from '@/components/ui/Price';
import MpesaSimulator from '@/components/checkout/MpesaSimulator';
import { SERVICE_FEE } from '@/lib/constants';

export default function StudentCheckout() {
  const router = useRouter();
  const { cartDeal, mpesaPhone, setMpesaPhone, clearCart } = useCart();
  const { updateStats } = useUser();
  const { createOrder } = useOrders();
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

  const handlePaymentSuccess = async () => {
    setIsPaying(false);
    const order = await createOrder(cartDeal);
    if (order) {
      updateStats(cartDeal.originalPrice - cartDeal.dealPrice);
      clearCart();
      router.push('/student/orders');
    } else {
      alert("Failed to secure deal. Someone might have beaten you to it!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full mx-auto flex flex-col gap-5"
    >
      <div>
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-1 leading-tight">Checkout</h2>
        <p className="text-[#5a4136] text-sm">Review your flash deal and trigger secure mobile payment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left: Item + Payment */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-[#F3F4F6] p-4 flex gap-4 items-center shadow-sm">
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative bg-gray-100 border">
              <img src={cartDeal.image} alt={cartDeal.title} className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 bg-[#E11D48] text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg">
                -{cartDeal.discountPercentage}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base text-[#111827] leading-tight truncate">{cartDeal.title}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">{cartDeal.vendor} &bull; Pickup in {cartDeal.timeStart}</p>
            </div>
            <Price amount={cartDeal.dealPrice} size="lg" className="shrink-0" />
          </div>

          <div className="bg-white rounded-xl border border-[#F3F4F6] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Smartphone className="w-5 h-5 text-[#26B24B]" />
              <h3 className="font-display font-extrabold text-base text-[#111827]">Payment Method (M-Pesa)</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2 ml-1">M-Pesa Registered Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-sm font-bold text-gray-400">+254</span>
                </div>
                <input type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="7XX XXX XXX" className="w-full h-12 pl-14 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-[#111827] font-semibold outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all" />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 ml-1">We will dispatch an automated Safaricom Daraja STK Push prompt to this handset.</p>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-xl border border-[#F3F4F6] p-5 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-display font-extrabold text-base text-[#111827]">Order Summary</h3>
            <div className="space-y-2 text-sm border-b border-gray-100 pb-3.5">
              <div className="flex justify-between text-[#5a4136]">
                <span>Flash Deal Price</span>
                <Price amount={cartDeal.dealPrice} size="sm" />
              </div>
              <div className="flex justify-between text-[#5a4136]">
                <span>Merchant Service Fee</span>
                <Price amount={SERVICE_FEE} size="sm" />
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-base font-bold text-[#111827]">Grand Total</span>
              <Price amount={total} size="xl" className="text-[#FF6B00]" />
            </div>
            <button type="button" onClick={() => setIsPaying(true)} className="w-full h-12 bg-[#26B24B] hover:bg-[#209c40] text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 duration-100 shadow-md">
              <Lock className="w-4 h-4" />
              <span>Pay Ksh {total} with M-Pesa</span>
            </button>
            <p className="text-[10px] text-gray-400 leading-normal text-center pt-2">
              Safaricom Daraja payment secures deal instantly. No cash accepted on pickup.
            </p>
          </div>
        </div>
      </div>

      {isPaying && (
        <MpesaSimulator
          amount={total}
          phoneNumber={`+254 ${mpesaPhone}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setIsPaying(false)}
        />
      )}
    </motion.div>
  );
}

