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
        const mappedOrders: Order[] = data.map((o: any) => ({
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
        <StudentOrdersClient
            initialPastOrders={initialPastOrders}
            initialActiveOrder={initialActiveOrder}
        />
    );
}
