'use client';

import { ShieldAlert, Flame } from 'lucide-react';
import type { Deal } from '@/types';
import DealCard from './DealCard';
import { motion } from 'motion/react';

interface MarketplaceFeedProps {
  deals: Deal[];
  layout?: 'grid' | 'masonry';
  onSelectDeal: (deal: Deal) => void;
  onQuickReserve: (deal: Deal, e: React.MouseEvent) => void;
}

export default function MarketplaceFeed({
  deals,
  layout = 'grid',
  onSelectDeal,
  onQuickReserve,
}: MarketplaceFeedProps) {
  if (deals.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="inline-flex p-4 rounded-full bg-orange-50 text-[#FF6B00] mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="font-display font-extrabold text-xl text-[#111827] mb-1">
          No Flash Deals Found
        </h3>
        <p className="text-sm text-gray-400">
          Try adjusting your campus location filter or typing a different keyword to find deals!
        </p>
      </div>
    );
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (layout === 'masonry') {
    return (
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4"
      >
        {deals.map((deal) => (
          <motion.div variants={item} key={deal.id} className="break-inside-avoid">
            <DealCard
              deal={deal}
              layout="masonry"
              onSelect={onSelectDeal}
              onQuickReserve={onQuickReserve}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Grid Layout - Hybrid approach (Horizontal Carousel on Mobile + 2-col Grid)
  // Get top 4 deals with highest discount for the "Hot Deals" carousel
  const hotDeals = [...deals].sort((a, b) => b.discountPercentage - a.discountPercentage).slice(0, 5);
  // Get the rest for the main grid
  const regularDeals = deals.filter(d => !hotDeals.find(h => h.id === d.id));

  return (
    <div className="flex flex-col gap-8">
      {/* Mobile-only Hot Deals Carousel */}
      {hotDeals.length > 0 && (
        <div className="block md:hidden -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-[#E11D48]" />
            <h3 className="font-display font-bold text-lg text-gray-900">Hot Deals</h3>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
            {hotDeals.map((deal) => (
              <div key={deal.id} className="snap-start shrink-0 w-[65vw] sm:w-[280px]">
                <DealCard
                  deal={deal}
                  layout="compact"
                  onSelect={onSelectDeal}
                  onQuickReserve={onQuickReserve}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
      <div>
        {hotDeals.length > 0 && (
          <h3 className="font-display font-bold text-lg text-gray-900 mb-4 block md:hidden">All Deals</h3>
        )}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        >
          {/* On desktop, we just show all deals in the grid since there's no horizontal carousel */}
          <div className="hidden md:contents">
            {deals.map((deal) => (
              <motion.div variants={item} key={deal.id}>
                <DealCard
                  deal={deal}
                  layout="grid"
                  onSelect={onSelectDeal}
                  onQuickReserve={onQuickReserve}
                />
              </motion.div>
            ))}
          </div>

          {/* On mobile, we show only the regular deals in the grid (hot deals are in carousel) */}
          <div className="contents md:hidden">
            {regularDeals.map((deal) => (
              <motion.div variants={item} key={deal.id}>
                <DealCard
                  deal={deal}
                  layout="compact"
                  onSelect={onSelectDeal}
                  onQuickReserve={onQuickReserve}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
