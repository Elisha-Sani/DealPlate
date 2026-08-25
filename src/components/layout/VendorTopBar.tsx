"use client";

interface VendorTopBarProps {
    title: string;
}

export default function VendorTopBar({ title }: VendorTopBarProps) {
    return (
        <div className="h-20 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
            <h2 className="text-2xl font-bold text-[#1E293B]">{title}</h2>
            <div className="flex items-center gap-4">
                {/* Icons and avatar removed for cleaner UI as per user request */}
            </div>
        </div>
    );
}
