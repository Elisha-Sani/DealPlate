"use client";

import { motion } from "motion/react";
import { Clock, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function VendorPendingPage() {
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/vendor/sign-in";
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 text-center"
            >
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-[#1E293B] mb-3">Application Under Review</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Thank you for applying to join DealPlate! Your vendor application is currently being reviewed by our team. You will receive an email notification once your account has been approved and activated.
                </p>
                <button
                    onClick={handleSignOut}
                    className="w-full h-12 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </motion.div>
        </div>
    );
}
