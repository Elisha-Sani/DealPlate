'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/providers/UserProvider';
import { mapSupabaseDeal } from '@/lib/utils';
import type { Deal } from '@/types';

interface UseSavedDealsReturn {
  savedDealIds: Set<string>;
  savedDeals: Deal[];
  isLoading: boolean;
  isSaved: (dealId: string) => boolean;
  toggleSaved: (dealId: string) => Promise<void>;
}

export function useSavedDeals(initialSavedDeals?: Deal[], initialSavedDealIds?: Set<string>): UseSavedDealsReturn {
  const { user } = useUser();
  const [savedDealIds, setSavedDealIds] = useState<Set<string>>(initialSavedDealIds || new Set());
  const [savedDeals, setSavedDeals] = useState<Deal[]>(initialSavedDeals || []);
  const [isLoading, setIsLoading] = useState(!initialSavedDeals);

  useEffect(() => {
    if (initialSavedDeals) setSavedDeals(initialSavedDeals);
    if (initialSavedDealIds) setSavedDealIds(initialSavedDealIds);
  }, [initialSavedDeals, initialSavedDealIds]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSavedDealIds(new Set());
      setSavedDeals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_deals')
      .select('deal_id, deals(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const dataTyped = data as Record<string, unknown>[];
      setSavedDealIds(new Set(dataTyped.map((row) => String(row.deal_id))));
      setSavedDeals(
          dataTyped
              .filter((row) => row.deals)
              .map((row) => mapSupabaseDeal(row.deals as Record<string, unknown>))
      );
    } else {
      setSavedDealIds(new Set());
      setSavedDeals([]);
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSaved = useCallback((dealId: string) => savedDealIds.has(dealId), [savedDealIds]);

    const toggleSaved = useCallback(
      async (dealId: string) => {
        if (!user?.id) {
          window.location.href = '/student/sign-in';
          return;
        }

      if (savedDealIds.has(dealId)) {
        setSavedDealIds((prev) => {
          const next = new Set(prev);
          next.delete(dealId);
          return next;
        });
        await supabase.from('saved_deals').delete().eq('user_id', user.id).eq('deal_id', dealId);
      } else {
        setSavedDealIds((prev) => new Set(prev).add(dealId));
        await supabase.from('saved_deals').insert({ user_id: user.id, deal_id: dealId });
      }
      await refresh();
    },
    [user?.id, savedDealIds, refresh]
  );

  return { savedDealIds, savedDeals, isLoading, isSaved, toggleSaved };
}
