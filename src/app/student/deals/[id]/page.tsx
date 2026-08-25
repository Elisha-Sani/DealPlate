import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DealDetailsClient from "./DealDetailsClient";
import type { Deal } from "@/types";
import { mapSupabaseDeal } from "@/lib/utils";

export default async function DealDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    let deal: Deal | null = null;
    if (dealData && !dealError) {
        deal = mapSupabaseDeal(dealData);
    }

    let initialSavedDealIds = new Set<string>();
    if (session?.user?.id && deal) {
        const { data: savedData, error: savedError } = await supabase
            .from('saved_deals')
            .select('deal_id')
            .eq('user_id', session.user.id)
            .eq('deal_id', deal.id);
            
        if (!savedError && savedData && savedData.length > 0) {
            initialSavedDealIds.add(deal.id);
        }
    }

    return (
        <DealDetailsClient
            deal={deal}
            initialSavedDealIds={initialSavedDealIds}
        />
    );
}
