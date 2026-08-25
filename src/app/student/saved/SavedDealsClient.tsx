'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useSavedDeals } from '@/hooks/useSavedDeals';
import { useCart } from '@/providers/CartProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MarketplaceFeed from '@/components/deal/MarketplaceFeed';
import type { Deal } from '@/types';

export default function SavedDealsClient({ initialSavedDeals, initialSavedDealIds }: { initialSavedDeals: Deal[], initialSavedDealIds: Set<string> }) {
  const router = useRouter();
  const { savedDeals } = useSavedDeals(initialSavedDeals, initialSavedDealIds);
  const { setCartDeal } = useCart();

  const handleSelectDeal = (deal: Deal) => {
    router.push(`/student/deals/${deal.id}`);
  };

  const handleQuickReserve = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartDeal(deal);
    router.push('/student/checkout');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-6">
      <div>
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-1 flex items-center gap-2">
          <Heart className="w-7 h-7 text-[#E11D48]" fill="currentColor" />
          Saved Deals
        </h2>
        <p className="text-[#5a4136] text-sm">Deals you've bookmarked to grab before they're gone.</p>
      </div>

      {savedDeals.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="inline-flex p-4 rounded-full bg-orange-50 text-[#FF6B00] mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-[#111827] mb-1">No saved deals yet</h3>
          <p className="text-sm text-gray-400 mb-4">Tap the heart icon on a deal to save it here for later.</p>
          <button onClick={() => router.push('/student/explore')} className="text-sm font-bold text-[#FF6B00] hover:underline">
            Browse Deals
          </button>
        </div>
      ) : (
        <MarketplaceFeed deals={savedDeals} onSelectDeal={handleSelectDeal} onQuickReserve={handleQuickReserve} />
      )}
    </motion.div>
  );
}
