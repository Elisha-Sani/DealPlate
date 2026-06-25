'use client';

import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { VendorOrder } from '@/types';

interface OrderQueueTableProps {
  orders: VendorOrder[];
}

export default function OrderQueueTable({ orders }: OrderQueueTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-4 bg-[#F8FAFC]">
        <div className="flex gap-2">
          <button className="px-4 py-1.5 bg-[#1E293B] text-white rounded-full text-sm font-medium">
            All Orders (142)
          </button>
          <button className="px-4 py-1.5 bg-white border border-[#E2E8F0] text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50">
            Awaiting Pickup (89)
          </button>
          <button className="px-4 py-1.5 bg-white border border-[#E2E8F0] text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50">
            Collected (53)
          </button>
        </div>
        <select className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-gray-600 outline-none">
          <option>Filter by Institution</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-[#E2E8F0]">
            <tr>
              <th className="px-6 py-4 font-semibold">Order ID</th>
              <th className="px-6 py-4 font-semibold">Student Details</th>
              <th className="px-6 py-4 font-semibold">Institution</th>
              <th className="px-6 py-4 font-semibold">M-Pesa Ref</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{order.id}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-[#1E293B]">{order.studentName}</div>
                  <div className="text-xs text-gray-500">{order.studentPhone}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-[#F1F5F9] text-gray-600 rounded text-xs font-medium">
                    {order.institution}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{order.mpesaRef}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Paid Upfront
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      order.status === 'Awaiting Pickup'
                        ? 'bg-orange-50 text-[#FF6B00]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {order.status === 'Awaiting Pickup' ? (
                    <button
                      onClick={() => router.push('/vendor/pickup')}
                      className="px-4 py-1.5 border border-[#E2E8F0] hover:border-[#1E293B] rounded-lg text-sm font-medium text-[#1E293B] transition-colors"
                    >
                      Mark Collected
                    </button>
                  ) : (
                    <button className="p-1.5 text-gray-400 hover:text-[#1E293B] transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#E2E8F0] flex justify-between items-center text-sm text-gray-500">
        <span>Showing 1 to {orders.length} of 142 orders</span>
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded border border-transparent hover:bg-gray-100 flex items-center justify-center">
            &lt;
          </button>
          <button className="w-8 h-8 rounded bg-[#FF6B00] text-white font-bold flex items-center justify-center">
            1
          </button>
          <button className="w-8 h-8 rounded border border-transparent hover:bg-gray-100 flex items-center justify-center">
            2
          </button>
          <button className="w-8 h-8 rounded border border-transparent hover:bg-gray-100 flex items-center justify-center">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
