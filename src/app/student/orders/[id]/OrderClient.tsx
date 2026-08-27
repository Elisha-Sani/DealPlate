'use client';

import { motion } from 'motion/react';
import { ArrowLeft, Clock, Store, CheckCircle2, ChevronRight, Share2, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Price from '@/components/ui/Price';
import type { Order } from '@/types';
import { useEffect, useState } from 'react';

export default function OrderClient({ order }: { order: Order }) {
  const [wasJustConfirmed, setWasJustConfirmed] = useState(false);

  useEffect(() => {
    setWasJustConfirmed(new URLSearchParams(window.location.search).get('confirmed') === '1');
  }, []);

  const isPending = order.status === 'Pending';
  const isActive = order.status === 'Active';
  const isCompleted = order.status === 'Completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl w-full mx-auto flex flex-col gap-6"
    >
      <div>
        <Link
          href="/student/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-1">
          {wasJustConfirmed ? 'Payment Successful!' : 'Order Details'}
        </h2>
        <p className="text-[#5a4136] text-sm">
          {wasJustConfirmed 
            ? 'Your flash deal is secured. Show this code to the vendor.' 
            : 'Track your order status and pickup code.'}
        </p>
      </div>

      {wasJustConfirmed && (
        <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Order confirmed</p>
            <p className="text-xs text-green-700/80">Your pickup code is ready below.</p>
          </div>
        </div>
      )}

      {/* Pickup Code Section */}
      <div className="bg-white rounded-2xl border-2 border-[#FF6B00] p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Store className="w-24 h-24 text-[#FF6B00]" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-[#FF6B00] mb-2 relative z-10">
          Your Pickup Code
        </span>
        {order.pickupCode ? (
          <div className="font-mono text-5xl md:text-6xl font-black tracking-widest text-[#111827] bg-[#FFF8F6] border-2 border-[#FF6B00]/20 rounded-2xl px-6 py-4 relative z-10 shadow-inner">
            {order.pickupCode}
          </div>
        ) : (
          <div className="font-mono text-xl font-bold tracking-widest text-gray-400 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 relative z-10">
            PENDING
          </div>
        )}
        <p className="text-sm text-gray-500 mt-4 relative z-10 font-medium">
          Show this code to the vendor to claim your deal.
        </p>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm">
        <h3 className="font-display font-extrabold text-lg text-[#111827] mb-4">Status</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#111827]">Paid</p>
              <p className="text-xs text-gray-500">M-Pesa payment received</p>
            </div>
            <p className="text-xs font-bold text-gray-400">{order.time}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isActive || isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {isActive || isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${isActive || isCompleted ? 'text-[#111827]' : 'text-gray-400'}`}>
                Ready for Pickup
              </p>
              <p className="text-xs text-gray-500">Pick up between {order.deal.timeStart} and {order.deal.timeEnd}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 opacity-50" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${isCompleted ? 'text-[#111827]' : 'text-gray-400'}`}>
                Completed
              </p>
              <p className="text-xs text-gray-500">
                {isCompleted ? 'Enjoy your rescued meal!' : 'Pending pickup'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Details */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm">
        <h3 className="font-display font-extrabold text-lg text-[#111827] mb-4">Deal Details</h3>
        <div className="flex gap-4">
          <Image src={order.deal.image} alt={order.deal.title} width={80} height={80} className="rounded-xl object-cover border shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-base text-[#111827] truncate mb-1">
              {order.deal.title}
            </h4>
            <div className="flex items-center gap-1.5 text-sm text-[#5a4136] mb-1">
              <Store className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <span className="truncate">{order.deal.vendor}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{order.deal.campus}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-500">Total Paid</span>
          <Price amount={order.totalPaid} size="lg" className="text-[#FF6B00]" />
        </div>
      </div>
    </motion.div>
  );
}
