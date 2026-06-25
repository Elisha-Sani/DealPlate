'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import VendorTopBar from '@/components/layout/VendorTopBar';
import OrderQueueTable from '@/components/vendor/OrderQueueTable';
import { supabase } from '@/lib/supabase/client';
import type { Order, Deal } from '@/types';
import { useRouter } from 'next/navigation';

export default function VendorOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/vendor/sign-in');
      return;
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select(`*, deal:deals(*), student:user_id(*)`)
      .order('created_at', { ascending: false });

    if (ordersData) {
      const mappedOrders: Order[] = ordersData.filter(o => o.deal).map(o => ({
        id: o.id,
        deal: {
          id: o.deal.id,
          title: o.deal.title,
          vendor: o.deal.vendor,
          campus: o.deal.campus,
          originalPrice: Number(o.deal.original_price),
          dealPrice: Number(o.deal.deal_price),
          image: o.deal.image,
          discountPercentage: o.deal.discount_percentage,
          timeStart: o.deal.time_start,
          timeEnd: o.deal.time_end,
          category: o.deal.category,
          stockCount: o.deal.stock_count,
          durationRemaining: o.deal.duration_remaining
        } as Deal,
        student: o.student ? {
          full_name: o.student.full_name,
          phone: o.student.phone,
          university: o.student.university,
        } : undefined,
        date: o.order_date,
        time: o.order_time,
        status: o.status as any,
        totalPaid: Number(o.total_paid),
        pickupCode: o.pickup_code,
        pickupDeadline: o.pickup_deadline
      }));
      setOrders(mappedOrders);
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    fetchOrders();

    const ordersChannel = supabase
      .channel('vendor_orders_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchOrders]);

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
            <button 
              onClick={fetchOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          </div>
        ) : (
          <OrderQueueTable orders={orders} />
        )}
      </div>
    </motion.div>
  );
}
