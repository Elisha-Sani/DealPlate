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
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VendorDashboard() {
  const router = useRouter();
  const [vendorName, setVendorName] = useState('Loading...');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [revenue, setRevenue] = useState(0);
  const [activeBags, setActiveBags] = useState(0);
  const [pendingPickups, setPendingPickups] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/vendor/sign-in');
      return;
    }

    // 1. Get Vendor Profile
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('id', session.user.id)
      .single();

    if (!vendorData) {
      setVendorName('Vendor Profile Not Found');
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
        originalPrice: Number(d.original_price),
        dealPrice: Number(d.deal_price),
        image: d.image,
        discountPercentage: d.discount_percentage,
        timeStart: d.time_start,
        timeEnd: d.time_end,
        category: d.category,
        tags: d.tags || [],
        description: d.description,
        stockCount: d.stock_count,
        isPublished: d.is_published !== false,
        durationRemaining: d.duration_remaining
      }));
      setDeals(mappedDeals);
      setActiveBags(mappedDeals.filter((d) => d.isPublished !== false).reduce((sum, d) => sum + d.stockCount, 0));
    }

    // 3. Get Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`*, deal:deals(*), student:user_id(*)`)
      .order('created_at', { ascending: false });

    if (ordersData) {
      // The RLS policy "Vendors can view orders for their deals" filters this automatically, 
      // but we ensure we only process valid ones.
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
          isPublished: o.deal.is_published !== false,
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
      setRevenue(mappedOrders.reduce((sum, o) => sum + o.totalPaid, 0));
      setPendingPickups(mappedOrders.filter(o => o.status === 'Active').length);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchDashboardData();

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

