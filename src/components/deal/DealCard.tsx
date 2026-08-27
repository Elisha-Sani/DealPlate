'use client';

import Image from 'next/image';
import { Store, ShoppingBag } from 'lucide-react';
import type { Deal } from '@/types';
import Price from '@/components/ui/Price';
import Timer from '@/components/ui/Timer';
import { secondsUntil } from '@/lib/utils';
import Link from 'next/link';

interface DealCardProps {
  deal: Deal;
  layout?: 'grid' | 'masonry' | 'compact';
  onSelect: (deal: Deal) => void;
  onQuickReserve: (deal: Deal, e: React.MouseEvent) => void;
}

export default function DealCard({ deal, layout = 'grid', onSelect, onQuickReserve }: DealCardProps) {
  const isMasonry = layout === 'masonry';
  const isCompact = layout === 'compact';
  const isSmall = isMasonry || isCompact;

  return (
    <article
      className={`bg-white rounded-xl overflow-hidden border border-[#F3F4F6] shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] group relative flex flex-col ${isMasonry ? 'mb-4' : 'h-full'}`}
    >
      <Link href={`/student/deals/${deal.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${deal.title}`} />
      
      {/* Aspect-Video Top Image */}
      <div className={`relative w-full ${isSmall ? 'aspect-square' : 'aspect-video'} bg-[#F3F4F6] overflow-hidden shrink-0`}>
        <Image
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          src={deal.image}
          alt={deal.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Discount Badge */}
        <div className={`absolute top-2 left-2 bg-[#E11D48] text-white font-bold rounded-full shadow-md ${isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'} z-10`}>
          {deal.discountPercentage}% OFF
        </div>
      </div>

      {/* Content Area */}
      <div className={`${isSmall ? 'p-3' : 'p-4'} flex flex-col flex-1 gap-1.5`}>
        <h3 className={`font-display font-bold text-[#111827] line-clamp-2 group-hover:text-[#FF6B00] transition-colors leading-tight ${isSmall ? 'text-sm' : 'text-lg'}`}>
          {deal.title}
        </h3>

        <div className={`flex items-center gap-1.5 text-[#5a4136] ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
          <Store className={isSmall ? 'w-3 h-3 text-[#FF6B00] shrink-0' : 'w-3.5 h-3.5 text-[#FF6B00] shrink-0'} />
          <span className="truncate">
            {deal.vendor} - {deal.campus}
          </span>
        </div>

        {!isSmall && deal.briefDescription && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{deal.briefDescription}</p>
        )}

        <div className="flex items-center justify-between mt-0.5">
          <Timer initialSeconds={secondsUntil(deal.expiresAt)} />
          <span className={`font-bold text-[#E11D48] bg-[#E11D48]/10 rounded-full ${isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
            {deal.stockCount} left
          </span>
        </div>

        {/* Pricing Footer */}
        <div className={`mt-auto flex items-end justify-between ${isSmall ? 'pt-2' : 'pt-3'} border-t border-[#F3F4F6]`}>
          <div className="flex flex-col">
            <span className={`text-gray-400 line-through ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
              Ksh {deal.originalPrice.toLocaleString()}
            </span>
            <Price amount={deal.dealPrice} size={isSmall ? "md" : "lg"} className="text-[#FF6B00]" />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickReserve(deal, e);
            }}
            className={`relative z-20 ${isSmall ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-md hover:bg-[#e66000] active:scale-90 transition-all duration-200 shrink-0`}
            aria-label="Add deal to cart"
          >
            <ShoppingBag className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} />
          </button>
        </div>
      </div>
    </article>
  );
}
