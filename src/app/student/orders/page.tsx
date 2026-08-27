import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentOrdersClient from "./StudentOrdersClient";
import type { Deal, Order } from "@/types";

export default async function StudentOrdersPage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        redirect("/student/sign-in");
    }

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            deal:deals(*)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    let initialPastOrders: Order[] = [];
    let initialActiveOrder: Order | null = null;

    if (!error && data) {
        const dataTyped = data as Record<string, unknown>[];
        const mappedOrders: Order[] = dataTyped
            .map((o) => {
                const deal = o.deal as Record<string, unknown> | null;
                return {
                    id: String(o.id),
                    deal: {
                        id: deal ? String(deal.id) : String(o.deal_id || 'deleted-deal'),
                        title: deal ? String(deal.title) : String(o.deal_title || 'Unavailable Deal'),
                        vendor: deal ? String(deal.vendor) : String(o.deal_vendor || 'Unknown Vendor'),
                        campus: deal ? String(deal.campus) : 'Unknown Campus',
                        originalPrice: deal ? Number(deal.original_price) : Number(o.deal_original_price || o.total_paid),
                        dealPrice: deal ? Number(deal.deal_price) : Number(o.deal_price || o.total_paid),
                        image: deal ? String(deal.image) : String(o.deal_image || '/images/placeholder-meal.jpg'),
                        discountPercentage: deal ? Number(deal.discount_percentage) : 0,
                        timeStart: deal ? String(deal.time_start) : '--:--',
                        timeEnd: deal ? String(deal.time_end) : '--:--',
                        category: deal ? String(deal.category) : 'Other',
                        stockCount: deal ? Number(deal.stock_count) : 0,
                        expiresAt: deal ? String(deal.expires_at) : new Date().toISOString(),
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
        <StudentOrdersClient
            initialPastOrders={initialPastOrders}
            initialActiveOrder={initialActiveOrder}
        />
    );
}
