'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ListOrdered,
  Settings,
  Plus,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vendor/inventory', icon: Package, label: 'Inventory' },
  { path: '/vendor/orders', icon: ListOrdered, label: 'Order Queue' },
  { path: '/vendor/settings', icon: Settings, label: 'Settings' },
] as const;

export default function VendorSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] bg-[#1E293B] text-white flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FF6B00] rounded-lg flex items-center justify-center">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Vendor Portal</h1>
          <p className="text-xs text-gray-400">Managing Operations</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (pathname === '/vendor/pickup' && item.path === '/vendor/dashboard');

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-l-4',
                isActive
                  ? 'bg-[#334155] border-[#FF6B00] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#334155]/50 border-transparent'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <Link
          href="/vendor/inventory"
          className="w-full bg-[#FF6B00] hover:bg-[#e66000] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Item</span>
        </Link>
      </div>
    </div>
  );
}

