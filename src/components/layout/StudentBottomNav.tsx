'use client';

import { Compass, Heart, ReceiptText, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function StudentBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: '/student/explore', icon: Compass, label: 'Explore' },
    { path: '/student/saved', icon: Heart, label: 'Saved' },
    { path: '/student/orders', icon: ReceiptText, label: 'Orders' },
    { path: '/student/profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 shadow-lg flex justify-around items-center px-4 z-40 rounded-t-2xl md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-16 transition-all duration-150 active:scale-90',
              isActive ? 'text-[#FF6B00] scale-105 active:scale-100' : 'text-gray-400 hover:text-[#FF6B00]'
            )}
          >
            <div className={cn('p-1.5 rounded-full', isActive && 'bg-[#FF6B00]/10')}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

