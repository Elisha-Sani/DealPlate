"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Store, Eye, EyeOff, Lock, Mail, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function VendorSignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            setError(
                'Enter your business email above first, then click "Forgot password?".',
            );
            return;
        }
        setIsResetting(true);
        setError(null);
        setResetMessage(null);
        // No redirectTo needed here — the email template links directly to
        // /auth/reset-password with a token_hash, bypassing the code-exchange
        // callback entirely (see auth/reset-password/page.tsx for why).
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        setIsResetting(false);
        setResetMessage(
            error
                ? error.message
                : "If an account exists for that email, a reset link has been sent.",
        );
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else if (window.location.pathname !== "/vendor/sign-in") {
            // Served via middleware's masked rewrite while trying to reach some
            // other vendor page — the address bar already shows it, so refresh
            // in place instead of hardcoding a destination.
            router.refresh();
        } else {
            router.push("/vendor/dashboard");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F9FAFB]"
        >
            <div className="text-center mb-8">
                <div className="inline-flex w-14 h-14 bg-[#1E293B] rounded-xl items-center justify-center mb-4 shadow-sm">
                    <Store className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-[#1E293B] mb-2">
                    DealPlate
                </h1>
                <p className="text-gray-500">Vendor Portal Authentication</p>
            </div>

            <div className="w-full max-w-[480px] bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="h-1.5 w-full bg-[#FF6B00]" />
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
                        Sign In to Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Enter your credentials to manage your inventory and
                        deals.
                    </p>

                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 mb-6 flex gap-3 text-sm text-[#1E40AF]">
                        <div className="mt-0.5">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <p>
                            Note: Only verified vendor accounts can access the
                            management dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                                {error}
                            </div>
                        )}
                        {resetMessage && (
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                                {resetMessage}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                                Business Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vendor@demo.com"
                                    required
                                    className="w-full h-11 pl-11 pr-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-[#1E293B]">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={isResetting}
                                    className="text-sm text-[#FF6B00] hover:underline disabled:opacity-60"
                                >
                                    {isResetting
                                        ? "Sending..."
                                        : "Forgot password?"}
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    required
                                    className="w-full h-11 pl-11 pr-11 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E293B]"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm text-gray-600"
                            >
                                Remember my device for 30 days
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span>Access Dashboard &rarr;</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500 flex flex-col gap-2">
                        <p>
                            Need help?{" "}
                            <a
                                href="mailto:support.dealplate@mail.sanishome.com"
                                className="font-semibold text-[#1E293B] hover:underline"
                            >
                                Contact Vendor Support
                            </a>
                        </p>
                        <p>
                            New vendor?{" "}
                            <button
                                onClick={() => router.push("/vendor/apply")}
                                className="font-semibold text-[#FF6B00] hover:underline"
                            >
                                Apply here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
