'use client';

import { Settings, EyeOff, PackageOpen } from 'lucide-react';
import type { Deal } from '@/types';
import { motion } from 'motion/react';

interface ActiveListingsTableProps {
  deals: Deal[];
}

export default function ActiveListingsTable({ deals }: ActiveListingsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#1E293B]">Active Listings</h3>
      </div>
      <div className="flex-1 flex flex-col overflow-x-auto">
        {deals.length > 0 ? (
          <table className="w-full text-left relative">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Price (Ksh)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Actions</th>
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
                  <td className="px-6 py-4 font-bold text-[#FF6B00]">{item.dealPrice}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-orange-50 text-[#FF6B00] rounded text-xs font-bold border border-orange-100">
                      {item.stockCount} left
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 flex gap-2">
                    <button className="hover:text-[#1E293B] p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button className="hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <EyeOff className="w-4 h-4" />
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
            <h4 className="text-gray-900 font-bold mb-1">No Active Listings</h4>
            <p className="text-sm text-gray-500 max-w-sm">You haven't listed any surplus meals yet today. Head over to the inventory tab to publish a deal!</p>
          </div>
        )}
      </div>
    </div>
  );
}
