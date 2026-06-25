import { Bell, CheckCircle2 } from 'lucide-react';
import type { Order } from '@/types';
import { motion } from 'motion/react';

interface LiveFeedProps {
  orders: Order[];
}

export default function LiveFeed({ orders }: LiveFeedProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm flex flex-col h-[400px]">
      <div className="p-6 border-b border-[#E2E8F0] flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
        <h3 className="text-lg font-bold text-[#1E293B]">Live Activity Feed</h3>
      </div>
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        {orders.length > 0 ? orders.map((order, i) => {
          const isPending = order.status === 'Active';
          return (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={order.id}
              className={`relative pl-4 border-l-2 ${isPending ? 'border-[#FF6B00]' : 'border-green-500'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm text-[#1E293B] flex items-center gap-1.5">
                  {isPending ? 'Payment Received' : 'Order Picked Up'}
                  {!isPending && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                </span>
                <span className="text-xs text-gray-400 font-medium">{order.time}</span>
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{order.deal.title}</span> • Ksh {order.totalPaid}
              </p>
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <Bell className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500 max-w-[200px]">No recent activity yet. When students purchase your deals, they will appear here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
