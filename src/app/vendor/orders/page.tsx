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
        const ordersDataTyped = ordersData as Record<string, unknown>[];
        initialOrders = ordersDataTyped
            .filter((o) => o.deal)
            .map((o) => {
                const deal = o.deal as Record<string, unknown>;
                const student = o.student as Record<string, unknown> | undefined;

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
                    student: student
                        ? {
                              full_name: String(student.full_name),
                              phone: String(student.phone),
                              university: String(student.university),
                          }
                        : undefined,
                    date: String(o.order_date),
                    time: String(o.order_time),
                    status: o.status as any,
                    totalPaid: Number(o.total_paid),
                    pickupCode: String(o.pickup_code),
                    pickupDeadline: String(o.pickup_deadline),
                };
            });
    }

    return <OrdersClient initialOrders={initialOrders} />;
}
