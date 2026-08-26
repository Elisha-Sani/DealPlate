import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SavedDealsClient from "./SavedDealsClient";
import type { Deal } from "@/types";
import { mapSupabaseDeal } from "@/lib/utils";

export default async function SavedDealsPage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        redirect("/student/sign-in");
    }

    const { data, error } = await supabase
        .from('saved_deals')
        .select('deal_id, deals(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    let initialSavedDeals: Deal[] = [];
    let initialSavedDealIds = new Set<string>();

    if (!error && data) {
        const dataTyped = data as Record<string, unknown>[];
        initialSavedDealIds = new Set(dataTyped.map((row) => String(row.deal_id)));
        initialSavedDeals = dataTyped
            .filter((row) => row.deals)
            .map((row) => mapSupabaseDeal(row.deals as Record<string, unknown>));
    }

    return (
        <SavedDealsClient
            initialSavedDeals={initialSavedDeals}
            initialSavedDealIds={initialSavedDealIds}
        />
    );
}
