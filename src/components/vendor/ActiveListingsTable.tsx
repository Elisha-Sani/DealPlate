'use client';

import { PackageOpen, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Deal } from '@/types';
import { motion } from 'motion/react';

interface ActiveListingsTableProps {
  deals: Deal[];
}

export default function ActiveListingsTable({ deals }: ActiveListingsTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#1E293B]">Inventory Listings</h3>
        <button
          type="button"
          onClick={() => router.push('/vendor/inventory')}
          className="h-9 px-3 rounded-lg bg-[#FF6B00] text-white text-xs font-bold hover:bg-[#e66000]"
        >
          Manage Inventory
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-x-auto">
        {deals.length > 0 ? (
          <table className="w-full text-left relative">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {deals.map((item, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={item.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E2E8F0] bg-gray-100 shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-[#1E293B] line-clamp-1">{item.title}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#FF6B00]">Ksh {item.dealPrice}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-orange-50 text-[#FF6B00] rounded text-xs font-bold border border-orange-100">
                      {item.stockCount} left
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      item.isPublished === false
                        ? 'bg-gray-50 text-gray-500 border-gray-200'
                        : item.stockCount === 0
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {item.isPublished === false ? 'Hidden' : item.stockCount === 0 ? 'Sold out' : 'Published'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => router.push('/vendor/inventory')}
                      className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#1E293B] hover:bg-white flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" /> Manage
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-gray-900 font-bold mb-1">No Inventory Items</h4>
            <p className="text-sm text-gray-500 max-w-sm">Create items in the inventory tab, then publish them when ready for students.</p>
          </div>
        )}
      </div>
    </div>
  );
}
