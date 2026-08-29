import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrderClient from "./OrderClient";
import type { Deal, Order } from "@/types";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    const resolvedParams = await params;
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        redirect("/student/sign-in");
    }

    const { data: o, error } = await supabase
        .from('orders')
        .select(`
            *,
            deal:deals(*)
        `)
        .eq('id', resolvedParams.id)
        .eq('user_id', session.user.id)
        .single();

    if (error || !o) {
        redirect("/student/orders");
    }

    const deal = o.deal as Record<string, unknown> | null;
    const order: Order = {
        id: String(o.id),
        deal: {
            id: deal ? String(deal.id) : String(o.deal_id || 'deleted-deal'),
            title: deal ? String(deal.title) : String(o.deal_title || 'Unavailable Deal'),
            vendor: deal ? String(deal.vendor) : String(o.deal_vendor || 'Unknown Vendor'),
            campus: deal ? String(deal.campus) : 'Unknown Campus',
            originalPrice: deal ? Number(deal.original_price) : Number(o.deal_original_price || o.total_paid),
            dealPrice: deal ? Number(deal.deal_price) : Number(o.deal_price || o.total_paid),
            image: deal ? String(deal.image) : String(o.deal_image || '/images/dealplatehero.webp'),
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

    return <OrderClient order={order} />;
}
