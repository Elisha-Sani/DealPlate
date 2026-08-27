'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Clock, ShoppingBag } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Price from '@/components/ui/Price';

import type { Order } from '@/types';

export default function StudentOrdersClient({
  initialPastOrders,
  initialActiveOrder,
}: {
  initialPastOrders: Order[];
  initialActiveOrder: Order | null;
}) {
  const { pastOrders } = useOrders(initialPastOrders, initialActiveOrder);
  const [wasJustConfirmed, setWasJustConfirmed] = useState(false);

  useEffect(() => {
    setWasJustConfirmed(new URLSearchParams(window.location.search).get('confirmed') === '1');
  }, []);

  const activeOrders = pastOrders.filter((order) => order.status === 'Active' || order.status === 'Pending');
  const previousOrders = pastOrders.filter((order) => order.status !== 'Active' && order.status !== 'Pending');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-1">Orders</h2>
          <p className="text-[#5a4136] text-sm">Track pickup codes, active meals, and past DealPlate saves.</p>
        </div>
        <Link
          href="/student/explore"
          className="h-11 px-4 rounded-lg bg-[#FF6B00] text-white font-bold text-sm shadow-sm hover:bg-[#e66000] active:scale-95 transition-all flex items-center justify-center"
        >
          Browse Deals
        </Link>
      </div>

      {wasJustConfirmed && (
        <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Order confirmed</p>
            <p className="text-xs text-green-700/80">Your pickup code is now available under ready for pickup.</p>
          </div>
        </div>
      )}

      {pastOrders.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-10 text-center shadow-sm">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00] mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-[#111827] mb-2">No orders yet</h3>
          <p className="text-sm text-gray-500 mb-5">Your confirmed pickups will appear here after checkout.</p>
          <Link
            href="/student/explore"
            className="h-11 px-5 rounded-lg border border-[#FF6B00] text-[#FF6B00] font-bold text-sm hover:bg-[#FF6B00]/5 active:scale-95 transition-all flex items-center justify-center inline-flex"
          >
            Find Flash Deals
          </Link>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-display font-extrabold text-lg text-[#111827]">Ready for Pickup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <article key={order.id} className="bg-white border-2 border-[#FF6B00] rounded-xl p-4 shadow-sm flex gap-4">
                    <Image src={order.deal.image} alt={order.deal.title} width={80} height={80} className="rounded-lg object-cover border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF6B00]/10 text-[#FF6B00] px-2.5 py-0.5 rounded-full">{order.status}</span>
                      </div>
                      <h4 className="font-display font-bold text-base text-[#111827] truncate">{order.deal.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{order.date} &bull; {order.time}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {order.pickupCode && (
                          <span className="font-mono text-lg font-black tracking-widest text-[#111827] bg-[#FFF8F6] border border-[#FF6B00]/20 rounded-lg px-3 py-1">
                            {order.pickupCode}
                          </span>
                        )}
                        <Price amount={order.totalPaid} size="sm" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="font-display font-extrabold text-lg text-[#111827]">Order History</h3>
            <div className="flex flex-col gap-3">
              {previousOrders.length === 0 ? (
                <div className="bg-white border border-[#F3F4F6] rounded-xl p-5 text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B00]" />
                  Completed and cancelled orders will appear here.
                </div>
              ) : (
                previousOrders.map((order) => (
                  <article key={order.id} className="bg-white border border-[#F3F4F6] rounded-xl p-4 shadow-sm flex gap-4 items-center">
                    <Image src={order.deal.image} alt={order.deal.title} width={56} height={56} className="rounded-lg object-cover border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-sm text-[#111827] truncate">{order.deal.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{order.date} &bull; {order.time}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        order.status === 'Completed' ? 'bg-green-50 text-green-600'
                        : order.status === 'Cancelled' ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                      }`}>{order.status}</span>
                      <Price amount={order.totalPaid} size="sm" />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}


