'use client';

import { LayoutDashboard, Package, ListOrdered, Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function VendorBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { path: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/vendor/inventory', icon: Package, label: 'Inventory' },
    { path: '/vendor/orders', icon: ListOrdered, label: 'Orders' },
    { path: '/vendor/settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 shadow-lg flex justify-around items-center px-4 z-40 rounded-t-2xl md:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.path ||
          (pathname === '/vendor/pickup' && item.path === '/vendor/dashboard');

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
