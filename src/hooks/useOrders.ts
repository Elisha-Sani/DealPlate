'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Deal, Order } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/providers/UserProvider';
import { mockPastOrders } from '@/data/mock-orders';
import { SERVICE_FEE, PICKUP_WINDOW_SECONDS } from '@/lib/constants';
import { generatePickupCode } from '@/lib/utils';

interface UseOrdersReturn {
  pastOrders: Order[];
  activeOrder: Order | null;
  ticketSeconds: number;
  setTicketSeconds: (s: number) => void;
  createOrder: (deal: Deal) => Promise<Order | null>;
  clearActiveOrder: () => void;
  isLoading: boolean;
}

export function useOrders(): UseOrdersReturn {
  const { user } = useUser();
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [ticketSeconds, setTicketSeconds] = useState(PICKUP_WINDOW_SECONDS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          deal:deals(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Order[] = data.map(o => ({
          id: o.id,
          deal: {
            id: o.deal.id,
            title: o.deal.title,
            vendor: o.deal.vendor,
            campus: o.deal.campus,
            originalPrice: o.deal.original_price,
            dealPrice: o.deal.deal_price,
            image: o.deal.image,
            discountPercentage: o.deal.discount_percentage,
            timeStart: o.deal.time_start,
            timeEnd: o.deal.time_end,
            category: o.deal.category,
            stockCount: o.deal.stock_count,
            durationRemaining: o.deal.duration_remaining
          } as Deal,
          date: o.order_date,
          time: o.order_time,
          status: o.status,
          totalPaid: Number(o.total_paid),
          pickupCode: o.pickup_code,
          pickupDeadline: o.pickup_deadline
        }));
        setPastOrders(mapped);
      } else {
        setPastOrders(mockPastOrders);
      }
      setIsLoading(false);
    }
    fetchOrders();
  }, [user?.id]);

  const createOrder = useCallback(
    async (deal: Deal): Promise<Order | null> => {
      if (!user?.id) return null;
      
      const now = new Date();
      const newOrderPayload = {
        user_id: user.id,
        deal_id: deal.id,
        order_date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        order_time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: 'Active',
        total_paid: deal.dealPrice + SERVICE_FEE,
        pickup_code: generatePickupCode(),
      };

      const { data, error } = await supabase.from('orders').insert(newOrderPayload).select().single();
      
      if (!error && data) {
        // Also decrement stock in deals table
        const { error: rpcError } = await supabase.rpc('decrement_stock', { p_deal_id: deal.id });
        if (rpcError) console.error("Failed to decrement stock:", rpcError);
        const order: Order = {
          id: data.id,
          deal,
          date: data.order_date,
          time: data.order_time,
          status: data.status as any,
          totalPaid: Number(data.total_paid),
          pickupCode: data.pickup_code,
        };
        setActiveOrder(order);
        setPastOrders((prev) => [order, ...prev]);
        setTicketSeconds(PICKUP_WINDOW_SECONDS);
        return order;
      }
      return null;
    },
    []
  );

  const clearActiveOrder = useCallback(() => {
    setActiveOrder(null);
  }, []);

  return {
    pastOrders,
    activeOrder,
    ticketSeconds,
    setTicketSeconds,
    createOrder,
    clearActiveOrder,
    isLoading
  };
}
