import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExploreClient from "./ExploreClient";
import type { Deal, Order } from "@/types";
import { mapSupabaseDeal } from "@/lib/utils";

export default async function StudentExplorePage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const dealsPromise = supabase
        .from('deals')
        .select('*')
        .eq('is_published', true)
        .gt('stock_count', 0)
        .order('created_at', { ascending: false });

    const ordersPromise = session?.user?.id
        ? supabase
            .from('orders')
            .select(`
                *,
                deal:deals(*)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: null, error: null });

    const [dealsResult, ordersResult] = await Promise.all([dealsPromise, ordersPromise]);

    let initialDeals: Deal[] = [];
    if (dealsResult.data) {
        initialDeals = dealsResult.data.map(mapSupabaseDeal);
    }

    let initialPastOrders: Order[] = [];
    let initialActiveOrder: Order | null = null;

    if (ordersResult.data) {
        const ordersDataTyped = ordersResult.data as Record<string, unknown>[];
        const mappedOrders: Order[] = ordersDataTyped
            .filter((o) => o.deal != null)
            .map((o) => {
                const deal = o.deal as Record<string, unknown>;
                return {
                    id: String(o.id),
                    deal: {
                        id: String(deal.id),
                        title: String(deal.title),
                        vendor: String(deal.vendor),
                        campus: String(deal.campus),
                        originalPrice: Number(deal.original_price),
                        dealPrice: Number(deal.deal_price),
                        image: String(deal.image),
                        discountPercentage: Number(deal.discount_percentage),
                        timeStart: String(deal.time_start),
                        timeEnd: String(deal.time_end),
                        category: String(deal.category),
                        stockCount: Number(deal.stock_count),
                        expiresAt: String(deal.expires_at),
                    } as Deal,
                    date: String(o.order_date),
                    time: String(o.order_time),
                    status: o.status as any,
                    totalPaid: Number(o.total_paid),
                    pickupCode: String(o.pickup_code),
                    pickupDeadline: String(o.pickup_deadline),
                };
            });
        
        const active = mappedOrders.find(o => o.status === 'Active') || null;
        initialActiveOrder = active;
        initialPastOrders = mappedOrders.filter(o => o.id !== active?.id);
    }

    return (
        <ExploreClient 
            initialDeals={initialDeals}
            initialPastOrders={initialPastOrders}
            initialActiveOrder={initialActiveOrder}
        />
    );
}
