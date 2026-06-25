'use client';

import { ShieldAlert } from 'lucide-react';
import type { Deal } from '@/types';
import DealCard from './DealCard';

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

  const gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
  const masonryClass = "columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4";

  return (
    <div className={layout === 'grid' ? gridClass : masonryClass}>
      {deals.map((deal) => (
        <div key={deal.id} className={layout === 'masonry' ? 'break-inside-avoid' : ''}>
          <DealCard
            deal={deal}
            layout={layout}
            onSelect={onSelectDeal}
            onQuickReserve={onQuickReserve}
          />
        </div>
      ))}
    </div>
  );
}
