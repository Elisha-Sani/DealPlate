"use client";

import { ArrowLeft, Compass, Heart, ReceiptText, User, UserCheck } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";
import DealPlateLogo from "@/components/logo/DealPlateLogo";
import Link from "next/link";

export default function StudentHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();

    const isAuthPage =
        pathname === "/student/sign-in" ||
        pathname === "/student/sign-up" ||
        pathname === "/student/verify" ||
        pathname === "/student/upload-id";
    const isExplore = pathname === "/student/explore";

    const showBack = !isAuthPage && !isExplore;

    const navItems = [
        { path: "/student/explore", icon: Compass, label: "Explore" },
        { path: "/student/saved", icon: Heart, label: "Saved" },
        { path: "/student/orders", icon: ReceiptText, label: "Orders" },
        { path: "/student/profile", icon: User, label: "Profile" },
    ] as const;

    return (
        <header className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-[#F3F4F6] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DealPlateLogo className="w-40 h-auto" />
                </div>

                <div className="flex items-center gap-3">
                    {!isAuthPage && (
                        <nav className="hidden md:flex items-center gap-1 bg-[#F3F4F6] rounded-full p-1">
                            {navItems.map((item) => {
                                const isActive =
                                    pathname === item.path ||
                                    pathname.startsWith(item.path + "/");

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={cn(
                                            "h-9 px-3 rounded-full flex items-center gap-2 text-xs font-bold transition-all",
                                            isActive
                                                ? "bg-white text-[#FF6B00] shadow-sm"
                                                : "text-[#5a4136] hover:text-[#FF6B00]",
                                        )}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    )}

                    {user?.isVerified && !isAuthPage && (
                        <div className="hidden lg:flex items-center gap-1.5 bg-[#FF6B00]/10 text-[#FF6B00] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Verified student</span>
                        </div>
                    )}

                    {!user && !isAuthPage && (
                        <Link
                            href={`/student/sign-in?next=${encodeURIComponent(pathname)}`}
                            className="h-9 px-4 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-bold hover:bg-[#e66000] transition-colors shrink-0"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
