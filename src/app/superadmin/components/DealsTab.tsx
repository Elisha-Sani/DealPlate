import { Eye, EyeOff, Package, Search, Trash2 } from 'lucide-react';
import type { AdminDealRow } from '@/app/actions/adminGetDeals';

interface DealsTabProps {
  filteredDeals: AdminDealRow[];
  dealSearch: string;
  setDealSearch: (s: string) => void;
  dealStatusFilter: string;
  setDealStatusFilter: (s: string) => void;
  handleToggleDealPublished: (deal: AdminDealRow) => void;
  handleDeleteDeal: (deal: AdminDealRow) => void;
}

export function DealsTab({
  filteredDeals,
  dealSearch,
  setDealSearch,
  dealStatusFilter,
  setDealStatusFilter,
  handleToggleDealPublished,
  handleDeleteDeal,
}: DealsTabProps) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#FF6B00]" />
          <h2 className="font-bold text-lg">All Deals</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={dealStatusFilter}
            onChange={(e) => setDealStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00] bg-white cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="sold_out">Sold Out</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={dealSearch}
              onChange={(e) => setDealSearch(e.target.value)}
              placeholder="Search title or vendor..."
              className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:ring-2 focus:ring-[#FF6B00] w-64"
            />
          </div>
        </div>
      </div>
      <div className="divide-y divide-[#E2E8F0]">
        {filteredDeals.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No matching deals.</p>
        ) : (
          filteredDeals.map((deal) => (
            <article key={deal.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{deal.title}</h3>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                      deal.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {deal.is_published ? 'Published' : 'Hidden'}
                  </span>
                  {deal.stock_count === 0 && (
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-50 text-red-700">Sold out</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{deal.vendor} &bull; {deal.campus} &bull; Ksh {deal.deal_price} ({deal.stock_count} left)</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleDealPublished(deal)}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#1E293B] hover:bg-gray-50 flex items-center gap-1"
                >
                  {deal.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {deal.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDeleteDeal(deal)}
                  className="h-9 px-3 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
