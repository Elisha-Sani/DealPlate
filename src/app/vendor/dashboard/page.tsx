'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase/client';
import VendorTopBar from '@/components/layout/VendorTopBar';
import StatsCard from '@/components/vendor/StatsCard';
import ActiveListingsTable from '@/components/vendor/ActiveListingsTable';
import LiveFeed from '@/components/vendor/LiveFeed';
import RevenueChart from '@/components/vendor/RevenueChart';
import type { Deal, Order } from '@/types';
import { Loader2 } from 'lucide-react';

export default function VendorDashboard() {
  const [vendorName, setVendorName] = useState('Loading...');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [revenue, setRevenue] = useState(0);
  const [activeBags, setActiveBags] = useState(0);
  const [pendingPickups, setPendingPickups] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      // 1. Get Vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, business_name')
        .limit(1)
        .single();

      if (!vendorData) {
        setVendorName('Vendor Not Found');
        setLoading(false);
        return;
      }
      setVendorName(vendorData.business_name);

      // 2. Get Deals
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      let mappedDeals: Deal[] = [];
      if (dealsData) {
        mappedDeals = dealsData.map(d => ({
          id: d.id,
          title: d.title,
          vendor: d.vendor,
          campus: d.campus,
          originalPrice: d.original_price,
          dealPrice: d.deal_price,
          image: d.image,
          discountPercentage: d.discount_percentage,
          timeStart: d.time_start,
          timeEnd: d.time_end,
          category: d.category,
          tags: [],
          description: d.description,
          stockCount: d.stock_count,
          durationRemaining: d.duration_remaining
        }));
        setDeals(mappedDeals);
        
        // Calculate Active Bags
        setActiveBags(mappedDeals.reduce((sum, d) => sum + d.stockCount, 0));
      }

      // 3. Get Orders (for those deals)
      if (dealsData && dealsData.length > 0) {
        const dealIds = dealsData.map(d => d.id);
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`*, deal:deals(*)`)
          .in('deal_id', dealIds)
          .order('created_at', { ascending: false });

        if (ordersData) {
          const mappedOrders: Order[] = ordersData.map(o => ({
            id: o.id,
            deal: o.deal as any,
            date: o.order_date,
            time: o.order_time,
            status: o.status as any,
            totalPaid: Number(o.total_paid),
            pickupCode: o.pickup_code,
            pickupDeadline: o.pickup_deadline
          }));
          setOrders(mappedOrders);

          // Calculate Revenue
          setRevenue(mappedOrders.reduce((sum, o) => sum + o.totalPaid, 0));
          // Calculate Pending Pickups
          setPendingPickups(mappedOrders.filter(o => o.status === 'Active').length);
        }
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF6B00]" />
        <p className="mt-4 text-gray-500 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

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
