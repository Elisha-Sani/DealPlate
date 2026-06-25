'use client';

import { Bell, HelpCircle } from 'lucide-react';

interface VendorTopBarProps {
  title: string;
}

export default function VendorTopBar({ title }: VendorTopBarProps) {
  return (
    <div className="h-20 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
      <h2 className="text-2xl font-bold text-[#1E293B]">{title}</h2>
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full border border-[#E2E8F0] flex items-center justify-center text-gray-500 hover:text-[#1E293B] hover:bg-white transition-colors relative bg-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF6B00] rounded-full" />
        </button>
        <button className="w-10 h-10 rounded-full border border-[#E2E8F0] flex items-center justify-center text-gray-500 hover:text-[#1E293B] hover:bg-white transition-colors bg-white">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E2E8F0] bg-white cursor-pointer hover:border-[#FF6B00] transition-colors">
          <img
            src="https://i.pravatar.cc/150?img=11"
            alt="Vendor"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
