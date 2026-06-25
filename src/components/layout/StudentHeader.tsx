'use client';

import { ArrowLeft, UserCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/providers/UserProvider';

export default function StudentHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const isAuthPage =
    pathname === '/student/sign-in' ||
    pathname === '/student/sign-up' ||
    pathname === '/student/verify' ||
    pathname === '/student/upload-id';
  const isExplore = pathname === '/student/explore';

  const showBack = !isAuthPage && !isExplore;

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-[#F3F4F6] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#FF6B00] hover:bg-[#F3F4F6] transition-colors active:scale-90"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#FF6B00]">
            DealPlate
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isExplore && (
            <button
              onClick={() => router.push('/student/profile')}
              className="flex items-center gap-2 border border-[#F3F4F6] hover:border-[#FF6B00] bg-white rounded-full p-1 pr-3 shadow-sm hover:shadow transition-all text-xs font-semibold text-[#111827] active:scale-95 duration-100"
            >
              <img
                className="w-7 h-7 rounded-full object-cover border border-gray-200"
                src={user.avatar}
                alt={user.fullName}
              />
              <span className="hidden sm:inline">{user.fullName.split(' ')[0]}</span>
            </button>
          )}

          {user.isVerified && !isAuthPage && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#FF6B00]/10 text-[#FF6B00] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Verified student</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
