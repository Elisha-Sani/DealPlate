'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard } from 'lucide-react';
import VendorTopBar from '@/components/layout/VendorTopBar';
import OrderQueueTable from '@/components/vendor/OrderQueueTable';
import type { VendorOrder } from '@/types';

export default function VendorOrders() {
  const [orders] = useState<VendorOrder[]>([
    { id: '#ORD-9921', studentName: 'James Kamau', studentPhone: '+254 712 345678', institution: 'UoN Main', mpesaRef: 'QWE123RTY4', status: 'Awaiting Pickup', dealTitle: 'Lunch Surplus Bag' },
    { id: '#ORD-9920', studentName: 'Sarah Ochieng', studentPhone: '+254 722 987654', institution: 'Strathmore', mpesaRef: 'ASD987FGH6', status: 'Collected', dealTitle: 'Morning Pastries' },
    { id: '#ORD-9919', studentName: 'Brian Mutua', studentPhone: '+254 733 112233', institution: 'KU Ruiru', mpesaRef: 'ZXC456VBN7', status: 'Awaiting Pickup', dealTitle: 'Slice Combo' },
  ]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1">
      <VendorTopBar title="Live Order Queue" />
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500">Manage and verify upfront-paid student orders for collection.</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-semibold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              Live Sync Active
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
        <OrderQueueTable orders={orders} />
      </div>
    </motion.div>
  );
}
