'use client';

import { usePathname } from 'next/navigation';
import VendorSidebar from '@/components/layout/VendorSidebar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/vendor/sign-in' || pathname === '/vendor/apply';

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1E293B] font-sans flex overflow-hidden">
      {!isAuthPage && <VendorSidebar />}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
