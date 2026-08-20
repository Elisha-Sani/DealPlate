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

export default function VendorDashboard() {
  const [vendorName, setVendorName] = useState('Loading...');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [revenue, setRevenue] = useState(0);
  const [activeBags, setActiveBags] = useState(0);
  const [pendingPickups, setPendingPickups] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    // No client-side session check/redirect here — middleware already
    // guarantees only an authenticated vendor ever reaches this page (via
    // its masked-rewrite gate). A redundant, independently-timed getSession()
    // check here raced with that guarantee on fresh loads and could bounce
    // an already-authenticated vendor back to the sign-in form.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch everything in parallel — none of these actually depend on each
    // other (the vendor's own id is already known from the session), so
    // there's no reason to wait on the profile lookup before starting the
    // deals/orders queries.
    const [{ data: vendorData }, { data: dealsData }, { data: ordersData }] = await Promise.all([
      supabase.from('vendors').select('id, business_name').eq('id', user.id).single(),
      supabase.from('deals').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select(
          `id, order_date, order_time, status, total_paid, pickup_code, pickup_deadline,
           deal:deals(id, title, vendor, campus, original_price, deal_price, image, discount_percentage, time_start, time_end, category, stock_count, duration_remaining),
           student:user_id(full_name, phone, university)`
        )
        .order('created_at', { ascending: false }),
    ]);

    if (!vendorData) {
      setVendorName('Vendor Profile Not Found');
      setLoading(false);
      return;
    }
    setVendorName(vendorData.business_name);

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

    if (ordersData) {
      // Supabase's select-string type inference can't tell deal:/student: are
      // to-one relations here (no generated Database types configured), so
      // it infers them as arrays — cast through `any`; the actual runtime
      // shape is a single object per the foreign key.
      const ordersDataTyped = ordersData as any[];
      // The RLS policy "Vendors can view orders for their deals" filters this automatically,
      // but we ensure we only process valid ones.
      const mappedOrders: Order[] = ordersDataTyped.filter(o => o.deal).map(o => ({
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
  }, []);

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
      <div className="flex flex-col flex-1 pb-10">
        <div className="h-20 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center px-8 shrink-0">
          <div className="h-7 w-48 rounded-md bg-gray-200 animate-pulse" />
        </div>
        <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                <div className="h-8 w-20 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 h-64 animate-pulse" />
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 h-20 animate-pulse" />
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 h-20 animate-pulse" />
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 h-20 animate-pulse" />
          </div>
        </div>
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

