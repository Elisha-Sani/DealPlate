'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Deal } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { mockDeals } from '@/data/mock-deals';
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
        const { data, error } = await supabase.from('deals').select('*');
        if (error) {
          console.error('Error fetching deals:', error);
          setDeals(mockDeals);
        } else if (data && data.length > 0) {
          setDeals(data.map(mapSupabaseDeal));
        } else {
          setDeals(mockDeals);
        }
      } catch (err) {
        console.error(err);
        setDeals(mockDeals);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeals();
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

      return matchesSearch && matchesCampus;
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
