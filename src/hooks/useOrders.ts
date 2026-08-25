'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Deal, Order } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/providers/UserProvider';
import { PICKUP_WINDOW_SECONDS } from '@/lib/constants';

interface UseOrdersReturn {
  pastOrders: Order[];
  activeOrder: Order | null;
  ticketSeconds: number;
  setTicketSeconds: (s: number) => void;
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
            expiresAt: o.deal.expires_at
          } as Deal,
          date: o.order_date,
          time: o.order_time,
          status: o.status,
          totalPaid: Number(o.total_paid),
          pickupCode: o.pickup_code,
          pickupDeadline: o.pickup_deadline
        }));
        const active = mapped.find(o => o.status === 'Active') || null;
        setActiveOrder(active);
        setPastOrders(mapped.filter(o => o.id !== active?.id));
      } else {
        setPastOrders([]);
        setActiveOrder(null);
      }
      setIsLoading(false);
    }
    fetchOrders();

    if (user?.id) {
      const channel = supabase
        .channel('user_orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const clearActiveOrder = useCallback(() => {
    setActiveOrder(null);
  }, []);

  return {
    pastOrders,
    activeOrder,
    ticketSeconds,
    setTicketSeconds,
    clearActiveOrder,
    isLoading
  };
}
