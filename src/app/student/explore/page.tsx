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

    if (!session?.user?.id) {
        redirect("/student/sign-in");
    }

    const [dealsResult, ordersResult] = await Promise.all([
        supabase
            .from('deals')
            .select('*')
            .eq('is_published', true)
            .gt('stock_count', 0)
            .order('created_at', { ascending: false }),
            
        supabase
            .from('orders')
            .select(`
                *,
                deal:deals(*)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
    ]);

    let initialDeals: Deal[] = [];
    if (dealsResult.data) {
        initialDeals = dealsResult.data.map(mapSupabaseDeal);
    }

    let initialPastOrders: Order[] = [];
    let initialActiveOrder: Order | null = null;

    if (ordersResult.data) {
        const mappedOrders: Order[] = ordersResult.data
            .filter((o: any) => o.deal != null)
            .map((o: any) => ({
            id: o.id,
            deal: {
                id: o.deal.id,
                title: o.deal.title,
                vendor: o.deal.vendor,
                campus: o.deal.campus,
                originalPrice: o.deal.original_price,
                dealPrice: o.deal.deal_price,
                image: o.deal.image,
                discountPercentage: o.deal.discount_percentage,
                timeStart: o.deal.time_start,
                timeEnd: o.deal.time_end,
                category: o.deal.category,
                stockCount: o.deal.stock_count,
                expiresAt: o.deal.expires_at
            } as Deal,
            date: o.order_date,
            time: o.order_time,
            status: o.status,
            totalPaid: Number(o.total_paid),
            pickupCode: o.pickup_code,
            pickupDeadline: o.pickup_deadline
        }));
        
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
