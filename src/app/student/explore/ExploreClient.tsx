'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, X } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useOrders } from '@/hooks/useOrders';
import { useCart } from '@/providers/CartProvider';
import Price from '@/components/ui/Price';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MarketplaceFeed from '@/components/deal/MarketplaceFeed';
import { CAMPUSES } from '@/lib/constants';
import type { Deal, Order } from '@/types';

export default function ExploreClient({
  initialDeals,
  initialPastOrders,
  initialActiveOrder,
}: {
  initialDeals: Deal[];
  initialPastOrders: Order[];
  initialActiveOrder: Order | null;
}) {
  const router = useRouter();
  const { setCartDeal } = useCart();
  const { pastOrders } = useOrders(initialPastOrders, initialActiveOrder);
  const { filteredDeals, isLoading, searchQuery, setSearchQuery, selectedCampus, setSelectedCampus } = useDeals(initialDeals);
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');

  const handleSelectDeal = (deal: Deal) => {
    router.push(`/student/deals/${deal.id}`);
  };

  const handleQuickReserve = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartDeal(deal);
    router.push('/student/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col gap-6"
    >
      {/* Promo Banner */}
      <div className="w-full bg-gradient-to-r from-[#FF6B00] to-[#E11D48] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            High-Velocity Alert
          </span>
          <h2 className="text-2xl font-display font-extrabold tracking-tight">
            Nairobi Campus Flash Deals Are Live!
          </h2>
          <p className="text-white/80 text-sm">
            Up to 70% off artisan pizzas, fresh sushi, burgers, and pastries for verified students.
          </p>
        </div>
        <div className="text-white bg-black/15 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0 text-center">
          <span className="block text-xs uppercase tracking-wider opacity-85">Daily Saved Amount</span>
          <Price amount={pastOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.deal.originalPrice - o.deal.dealPrice), 0)} size="lg" className="text-white font-black" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl shadow-sm border border-[#F3F4F6] w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sushi, pizza, burgers, bakeries..."
            className="w-full h-12 pl-11 pr-4 rounded-lg bg-[#F3F4F6] border-none text-sm text-[#111827] placeholder-gray-400 focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all font-sans"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00]">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF6B00] w-4 h-4 pointer-events-none" />
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full h-12 pl-10 pr-10 rounded-lg bg-[#F3F4F6] border-none text-sm text-[#111827] focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all font-semibold appearance-none cursor-pointer"
            >
              {CAMPUSES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setLayout(layout === 'grid' ? 'masonry' : 'grid')}
            className="h-12 px-4 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg text-[#111827] flex items-center justify-center transition-colors shadow-sm shrink-0 font-medium text-sm gap-2"
          >
            {layout === 'grid' ? (
              <><span>Masonry</span></>
            ) : (
              <><span>Grid</span></>
            )}
          </button>
        </div>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <LoadingSpinner message="Hunting for flash deals..." />
      ) : (
        <MarketplaceFeed
          deals={filteredDeals}
          layout={layout}
          onSelectDeal={handleSelectDeal}
          onQuickReserve={handleQuickReserve}
        />
      )}
    </motion.div>
  );
}

