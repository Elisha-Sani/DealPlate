'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Share2, Store, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useCart } from '@/providers/CartProvider';
import { useUser } from '@/providers/UserProvider';
import { useSavedDeals } from '@/hooks/useSavedDeals';
import Price from '@/components/ui/Price';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Timer from '@/components/ui/Timer';
import { cn, mapSupabaseDeal, secondsUntil } from '@/lib/utils';
import type { Deal } from '@/types';

export default function DealDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setCartDeal } = useCart();
  const { user } = useUser();
  const { isSaved, toggleSaved } = useSavedDeals();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Fetch this deal directly instead of loading the entire explore list
  // again — faster, and works for direct/shared links too.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);

    supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
        } else {
          setDeal(mapSupabaseDeal(data));
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return <LoadingSpinner message="Loading deal..." />;
  }

  const handleToggleSaved = () => {
    if (!user) {
      router.push(`/student/sign-in?next=${encodeURIComponent(`/student/deals/${id}`)}`);
      return;
    }
    toggleSaved(id);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: deal?.title, url });
      } catch {
        // user cancelled the share sheet — no-op
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareFeedback('Link copied to clipboard');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  if (notFound || !deal) {
    return (
      <div className="max-w-md w-full mx-auto flex flex-col items-center text-center gap-3 py-20">
        <h2 className="font-display font-bold text-xl text-[#111827]">Deal not found</h2>
        <p className="text-sm text-gray-500">This deal may have sold out or been removed.</p>
        <button onClick={() => router.push('/student/explore')} className="mt-2 text-sm font-bold text-[#FF6B00] hover:underline">
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-5xl w-full mx-auto flex flex-col gap-5 px-4 md:px-0 pb-10"
    >
      {/* Back + actions */}
      <div className="flex justify-between items-center">
        <button onClick={() => router.push('/student/explore')} className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
        <div className="flex items-center gap-2">
          {shareFeedback && <span className="text-xs font-semibold text-gray-500">{shareFeedback}</span>}
          <button
            onClick={handleToggleSaved}
            aria-label={isSaved(id) ? 'Remove from saved deals' : 'Save this deal'}
            className={cn(
              'w-10 h-10 bg-white border border-[#F3F4F6] rounded-full flex items-center justify-center transition-colors shadow-sm',
              isSaved(id) ? 'text-[#E11D48]' : 'text-gray-400 hover:text-[#E11D48]'
            )}
          >
            <Heart className="w-5 h-5" fill={isSaved(id) ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share this deal"
            className="w-10 h-10 bg-white border border-[#F3F4F6] rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF6B00] transition-colors shadow-sm"
          >
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
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-gray-100 mt-4">
              <span className="text-sm font-semibold text-[#5a4136]">
                Only <span className="font-bold text-[#111827]">{deal.stockCount}</span> left
              </span>
              <div className="flex items-center gap-1.5 text-sm text-[#5a4136]">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">Ends in</span>
                <Timer initialSeconds={secondsUntil(deal.expiresAt)} variant="inline" />
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
