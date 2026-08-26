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
        <StudentOrdersClient
            initialPastOrders={initialPastOrders}
            initialActiveOrder={initialActiveOrder}
        />
    );
}
