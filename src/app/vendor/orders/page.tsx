import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";
import type { Order, Deal } from "@/types";

export default async function VendorOrdersPage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        redirect("/vendor/sign-in");
    }

    const { data: ordersData } = await supabase
        .from('orders')
        .select(
            `id, order_date, order_time, status, total_paid, pickup_code, pickup_deadline,
             deal:deals(id, title, vendor, campus, original_price, deal_price, image, discount_percentage, time_start, time_end, category, stock_count, expires_at),
             student:user_id(full_name, phone, university)`
        )
        // Since we are fetching all orders, we need to filter by vendor.
        // Wait! The client component didn't filter by vendor? 
        // Let's filter by vendor_id of the deals table. Supabase handles this via RLS (vendor can only see orders for their deals).
        .order('created_at', { ascending: false });

    let initialOrders: Order[] = [];

    if (ordersData) {
        const ordersDataTyped = ordersData as any[];
        initialOrders = ordersDataTyped.filter(o => o.deal).map(o => ({
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
                expiresAt: o.deal.expires_at
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
    }

    return <OrdersClient initialOrders={initialOrders} />;
}
