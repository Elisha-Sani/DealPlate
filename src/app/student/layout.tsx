'use client';

import { usePathname } from 'next/navigation';
import { UserProvider } from '@/providers/UserProvider';
import { CartProvider } from '@/providers/CartProvider';
import StudentHeader from '@/components/layout/StudentHeader';
import StudentBottomNav from '@/components/layout/StudentBottomNav';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/student/sign-in' ||
    pathname === '/student/sign-up' ||
    pathname === '/student/verify' ||
    pathname === '/student/upload-id';

  return (
    <UserProvider>
      <CartProvider>
        <div className="min-h-screen bg-[#FFF8F6] text-[#111827] font-sans flex flex-col antialiased select-none relative overflow-x-hidden">
          <StudentHeader />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-28 md:pb-8 flex flex-col justify-start">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>

          {!isAuthPage && <StudentBottomNav />}
        </div>
      </CartProvider>
    </UserProvider>
  );
}
