'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import VendorSidebar from '@/components/layout/VendorSidebar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsAuthenticated(Boolean(user)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setIsAuthenticated(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  // /vendor/apply is a genuinely public, unauthenticated page — hide chrome
  // there regardless of session. Every other vendor route requires auth, so
  // "no session" reliably means we're looking at the sign-in form — whether
  // reached directly or via middleware's masked rewrite (which leaves the
  // address bar showing whatever vendor page was originally requested).
  const isAuthPage = pathname === '/vendor/apply' || isAuthenticated === false;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1E293B] font-sans flex overflow-hidden">
      {!isAuthPage && <VendorSidebar />}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
