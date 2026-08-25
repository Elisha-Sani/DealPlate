'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase/client';
import VendorTopBar from '@/components/layout/VendorTopBar';
import StatsCard from '@/components/vendor/StatsCard';
import ActiveListingsTable from '@/components/vendor/ActiveListingsTable';
import LiveFeed from '@/components/vendor/LiveFeed';
import RevenueChart from '@/components/vendor/RevenueChart';
import type { Deal, Order } from '@/types';

import { useRouter } from 'next/navigation';

export default function DashboardClient({
  initialVendorName,
  initialDeals,
  initialOrders,
}: {
  initialVendorName: string;
  initialDeals: Deal[];
  initialOrders: Order[];
}) {
  const router = useRouter();
  const [vendorName, setVendorName] = useState(initialVendorName);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Stats
  const revenue = orders.reduce((sum, o) => sum + o.totalPaid, 0);
  const activeBags = deals.filter((d) => d.isPublished !== false).reduce((sum, d) => sum + d.stockCount, 0);
  const pendingPickups = orders.filter(o => o.status === 'Active').length;

  useEffect(() => {
    setVendorName(initialVendorName);
    setDeals(initialDeals);
    setOrders(initialOrders);
  }, [initialVendorName, initialDeals, initialOrders]);

  const fetchDashboardData = useCallback(async () => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    // Subscribe to deal changes
    const dealsChannel = supabase
      .channel('vendor_deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    // Subscribe to order changes
    const ordersChannel = supabase
      .channel('vendor_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchDashboardData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 pb-10">
      <VendorTopBar title={vendorName} />
      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Revenue (Ksh)" 
            value={revenue.toLocaleString()} 
            emoji="💰" 
            subtitle="Live updating" 
            subtitleColor="text-green-500" 
          />
          <StatsCard 
            title="Active Mystery Bags" 
            value={activeBags} 
            emoji="🛍️" 
            subtitle="Available in feed"
          />
          <StatsCard 
            title="Pending Pickups" 
            value={pendingPickups} 
            emoji="⌛" 
            subtitle={pendingPickups > 0 ? "Awaiting customers" : "All clear"} 
            subtitleColor={pendingPickups > 0 ? "text-red-500" : "text-gray-500"} 
          />
        </div>
        
        {/* Main Layout */}
        <div className="lg:col-span-2 space-y-6">
          <RevenueChart todayRevenue={revenue} />
          <ActiveListingsTable deals={deals} />
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <LiveFeed orders={orders} />
        </div>
      </div>
    </motion.div>
  );
}

