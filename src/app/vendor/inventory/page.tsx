import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InventoryClient, { InventoryItem, VendorProfile } from "./InventoryClient";

export function mapInventoryItem(row: Record<string, unknown>): InventoryItem {
    return {
        id: String(row.id),
        title: String(row.title),
        vendor: String(row.vendor),
        campus: String(row.campus),
        originalPrice: Number(row.original_price),
        dealPrice: Number(row.deal_price),
        image: String(row.image),
        discountPercentage: Number(row.discount_percentage),
        timeStart: String(row.time_start || "").slice(0, 5),
        timeEnd: String(row.time_end || "").slice(0, 5),
        category: String(row.category),
        description: String(row.description || ""),
        briefDescription: String(row.brief_description || ""),
        detailedDescription: String(row.detailed_description || ""),
        stockCount: Number(row.stock_count),
        isPublished: row.is_published !== false,
        expiresAt: String(row.expires_at),
        createdAt: String(row.created_at),
    };
}
export default async function VendorInventoryPage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        redirect("/vendor/sign-in");
    }

    const { data: vendorData } = await supabase
        .from("vendors")
        .select("id, business_name")
        .eq("id", session.user.id)
        .maybeSingle();

    let initialItems: any[] = [];

    if (vendorData) {
        const { data: dealsData } = await supabase
            .from("deals")
            .select("*")
            .eq("vendor_id", vendorData.id)
            .order("created_at", { ascending: false });
            
        if (dealsData) {
            initialItems = dealsData.map(mapInventoryItem);
        }
    }

    return (
        <InventoryClient 
            initialVendor={vendorData as VendorProfile | null}
            initialItems={initialItems}
        />
    );
}
