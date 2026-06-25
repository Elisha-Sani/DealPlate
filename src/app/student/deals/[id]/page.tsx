'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Share2, Store, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useCart } from '@/providers/CartProvider';
import Price from '@/components/ui/Price';
import Timer from '@/components/ui/Timer';
import { parseDurationToSeconds } from '@/lib/utils';

export default function DealDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { deals } = useDeals();
  const { setCartDeal } = useCart();
  const [isLoading, setIsLoading] = useState(true);

  const deal = deals.find((d) => d.id === id);

  // Artificial slight delay to ensure smooth transition from explore page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400); // 400ms simulate network latency or layout compute
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !deal) {
    return (
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-5 px-4 md:px-0">
        <div className="flex justify-between items-center animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded-md"></div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-[#F3F4F6] overflow-hidden shadow-sm md:flex min-h-[600px] animate-pulse">
          <div className="md:w-1/2 bg-gray-200 aspect-video md:aspect-auto"></div>
          <div className="p-8 md:p-10 md:w-1/2 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-10 w-3/4 bg-gray-200 rounded-lg"></div>
                <div className="h-5 w-1/3 bg-gray-200 rounded-md"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-20 w-full bg-gray-200 rounded-xl"></div>
              <div className="h-32 w-full bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-14 w-full bg-gray-200 rounded-xl mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl w-full mx-auto flex flex-col gap-5 px-4 md:px-0 pb-10"
    >
      {/* Back + actions */}
      <div className="flex justify-between items-center">
        <button onClick={() => router.push('/student/explore')} className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-white border border-[#F3F4F6] rounded-full flex items-center justify-center text-gray-400 hover:text-[#E11D48] transition-colors shadow-sm">
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-white border border-[#F3F4F6] rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF6B00] transition-colors shadow-sm">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Deal Card */}
      <div className="bg-white rounded-3xl border border-[#F3F4F6] overflow-hidden shadow-lg md:flex">
        {/* LEFT: Image */}
        <div className="relative aspect-video md:aspect-auto md:w-1/2 bg-[#F3F4F6] overflow-hidden shrink-0">
          <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
          <div className="absolute top-6 left-6 bg-[#E11D48] text-white text-sm font-black px-4 py-2 rounded-full shadow-lg border border-[#E11D48]/50 backdrop-blur-sm">
            {deal.discountPercentage}% SAVINGS
          </div>
        </div>

        {/* RIGHT: Content & Order Button */}
        <div className="p-6 md:p-10 md:w-1/2 flex flex-col bg-white relative z-10">
          
          <div className="flex-1 space-y-6">
            <div className="flex flex-col justify-between gap-4">
              <div>
                <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-[#111827] mb-3 leading-tight">{deal.title}</h2>
                <div className="flex items-center gap-2 text-sm font-bold text-[#5a4136]">
                  <Store className="w-5 h-5 text-[#FF6B00]" />
                  <span>{deal.vendor} &bull; {deal.campus}</span>
                </div>
              </div>
              <div className="flex items-end gap-2 bg-[#FFF8F6] px-5 py-3 rounded-2xl border border-[#FF6B00]/10 w-fit shrink-0 mt-2">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-400 line-through mb-1">Value Ksh {deal.originalPrice}</span>
                  <Price amount={deal.dealPrice} size="2xl" className="text-[#FF6B00]" />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-black px-4 py-1.5 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full uppercase tracking-widest">{deal.category}</span>
              {deal.tags.map((t, idx) => (
                <span key={idx} className="text-xs font-bold px-4 py-1.5 bg-gray-100 text-[#5a4136] rounded-full">{t}</span>
              ))}
            </div>

            {/* Urgency */}
            <div className="bg-[#E11D48]/5 border border-[#E11D48]/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner mt-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#E11D48] animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]" />
                <span className="text-sm font-black text-[#E11D48] uppercase tracking-wider">
                  Only {deal.stockCount} left
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-[#E11D48]/5">
                <Clock className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-xs font-bold text-[#5a4136] uppercase tracking-wider">Ends in:</span>
                <Timer initialSeconds={parseDurationToSeconds(deal.durationRemaining)} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase tracking-widest font-black text-gray-400 ml-1">Mystery Bag Details</h4>
              <div className="bg-[#F8FAFC] text-sm text-[#334155] leading-relaxed p-5 rounded-2xl border border-gray-100 font-medium">
                <p>{deal.detailedDescription || deal.description}</p>
              </div>
            </div>

            {/* Pickup specs */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase tracking-widest font-black text-gray-400 ml-1">Pickup Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Timeframe</span>
                    <span className="text-sm font-black text-[#111827]">{deal.timeStart} - {deal.timeEnd}</span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Address</span>
                    <span className="text-sm font-black text-[#111827] truncate">Campus Gate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - Pushed to the bottom */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => { setCartDeal(deal); router.push('/student/checkout'); }}
              className="w-full h-14 bg-[#FF6B00] hover:bg-[#e66000] text-white font-display font-extrabold text-lg tracking-tight rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 duration-100 shadow-[0_8px_20px_-6px_rgba(255,107,0,0.5)] hover:shadow-[0_12px_24px_-6px_rgba(255,107,0,0.6)]"
            >
              <ShoppingBag className="w-6 h-6" />
              <span>Place Order via M-Pesa</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
