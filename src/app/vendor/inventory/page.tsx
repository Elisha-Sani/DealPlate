import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InventoryClient, { mapInventoryItem, VendorProfile } from "./InventoryClient";

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

    let initialItems = [];

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
