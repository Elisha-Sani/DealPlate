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
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}

export function useDeals(initialDeals?: Deal[]): UseDealsReturn {
  const [deals, setDeals] = useState<Deal[]>(initialDeals || []);
  const [isLoading, setIsLoading] = useState(!initialDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('ending_soon'); // 'ending_soon' | 'price_low' | 'discount_high'

  useEffect(() => {
    if (initialDeals) {
      setDeals(initialDeals);
    }
  }, [initialDeals]);

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
    let result = deals.filter((deal) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        deal.title.toLowerCase().includes(q) ||
        deal.vendor.toLowerCase().includes(q) ||
        deal.category.toLowerCase().includes(q);

      const matchesCampus =
        selectedCampus === 'all' ||
        deal.campus.toLowerCase() === selectedCampus.toLowerCase();
        
      const matchesCategory = 
        selectedCategory === 'All' ||
        deal.category.toLowerCase() === selectedCategory.toLowerCase();
        
      return matchesSearch && matchesCampus && matchesCategory;
    });
    
    result.sort((a, b) => {
      if (sortBy === 'price_low') {
        return a.dealPrice - b.dealPrice;
      } else if (sortBy === 'discount_high') {
        return b.discountPercentage - a.discountPercentage;
      } else {
        // default: ending_soon
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
    });
    
    return result;
  }, [deals, searchQuery, selectedCampus, selectedCategory, sortBy]);

  return {
    deals,
    filteredDeals,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCampus,
    setSelectedCampus,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
  };
}


