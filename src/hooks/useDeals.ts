'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Deal } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseDeal } from '@/lib/utils';

interface UseDealsReturn {
  deals: Deal[];
  filteredDeals: Deal[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCampus: string;
  setSelectedCampus: (c: string) => void;
}

export function useDeals(): UseDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setIsLoading(true);
        // Filter server-side instead of fetching every deal and discarding
        // unpublished/sold-out rows client-side — smaller payload, faster load.
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('is_published', true)
          .gt('stock_count', 0)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching deals:', error);
          setDeals([]);
        } else if (data) {
          setDeals(data.map(mapSupabaseDeal));
        }
      } catch (err) {
        console.error(err);
        setDeals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();

    const channel = supabase
      .channel('deals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        deal.title.toLowerCase().includes(q) ||
        deal.vendor.toLowerCase().includes(q) ||
        deal.category.toLowerCase().includes(q);

      const matchesCampus =
        selectedCampus === 'all' ||
        deal.campus.toLowerCase() === selectedCampus.toLowerCase();
      const hasStock = deal.stockCount > 0;
      const isPublished = deal.isPublished !== false;

      return isPublished && hasStock && matchesSearch && matchesCampus;
    });
  }, [deals, searchQuery, selectedCampus]);

  return {
    deals,
    filteredDeals,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCampus,
    setSelectedCampus,
  };
}


