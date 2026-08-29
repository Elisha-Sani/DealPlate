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

export function useOrders(initialPastOrders?: Order[], initialActiveOrder?: Order | null): UseOrdersReturn {
  const { user } = useUser();
  const [pastOrders, setPastOrders] = useState<Order[]>(initialPastOrders || []);
  const [activeOrder, setActiveOrder] = useState<Order | null>(initialActiveOrder || null);
  const [ticketSeconds, setTicketSeconds] = useState(PICKUP_WINDOW_SECONDS);
  const [isLoading, setIsLoading] = useState(!initialPastOrders);

  useEffect(() => {
    if (initialPastOrders) setPastOrders(initialPastOrders);
    if (initialActiveOrder !== undefined) setActiveOrder(initialActiveOrder);
  }, [initialPastOrders, initialActiveOrder]);

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
        const mapped: Order[] = data.map(o => {
          const deal = o.deal as Record<string, any> | null;
          return {
            id: o.id,
            deal: {
              id: deal ? deal.id : (o.deal_id || 'deleted-deal'),
              title: deal ? deal.title : (o.deal_title || 'Unavailable Deal'),
              vendor: deal ? deal.vendor : (o.deal_vendor || 'Unknown Vendor'),
              campus: deal ? deal.campus : 'Unknown Campus',
              originalPrice: Number(deal ? deal.original_price : (o.deal_original_price ?? o.total_paid ?? 0)),
              dealPrice: Number(deal ? deal.deal_price : (o.deal_price ?? o.total_paid ?? 0)),
              image: deal?.image || o.deal_image || '/images/dealplatehero.webp',
              discountPercentage: Number(deal?.discount_percentage ?? 0),
              timeStart: deal?.time_start || '--:--',
              timeEnd: deal?.time_end || '--:--',
              category: deal?.category || 'lunch',
              stockCount: Number(deal?.stock_count ?? 0),
              expiresAt: deal?.expires_at || ''
            } as Deal,
            date: o.order_date,
            time: o.order_time,
            status: o.status,
            totalPaid: Number(o.total_paid),
            pickupCode: o.pickup_code,
            pickupDeadline: o.pickup_deadline
          };
        });
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
