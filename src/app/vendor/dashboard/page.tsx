import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import type { Deal, Order } from "@/types";

export default async function VendorDashboardPage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        redirect("/vendor/sign-in");
    }

    const [{ data: vendorData }, { data: dealsData }, { data: ordersData }] = await Promise.all([
        supabase.from('vendors').select('id, business_name').eq('id', session.user.id).single(),
        supabase.from('deals').select('*').eq('vendor_id', session.user.id).order('created_at', { ascending: false }),
        supabase
            .from('orders')
            .select(
                `id, order_date, order_time, status, total_paid, pickup_code, pickup_deadline,
                 deal:deals(id, title, vendor, campus, original_price, deal_price, image, discount_percentage, time_start, time_end, category, stock_count, expires_at),
                 student:user_id(full_name, phone, university)`
            )
            .order('created_at', { ascending: false }),
    ]);

    if (!vendorData) {
        return <DashboardClient initialVendorName="Vendor Profile Not Found" initialDeals={[]} initialOrders={[]} />;
    }

    let initialDeals: Deal[] = [];
    if (dealsData) {
        initialDeals = dealsData.map(d => ({
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
            expiresAt: d.expires_at
        }));
    }

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
                isPublished: o.deal.is_published !== false,
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

    return (
        <DashboardClient
            initialVendorName={vendorData.business_name}
            initialDeals={initialDeals}
            initialOrders={initialOrders}
        />
    );
}
