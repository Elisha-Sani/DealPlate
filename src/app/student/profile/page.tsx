'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Edit3, TrendingDown, ShoppingBag, UserCheck, LogOut, Camera } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/lib/supabase/client';
import Price from '@/components/ui/Price';

export default function StudentProfile() {
  const router = useRouter();
  const { user, logout, setUser } = useUser();
  const { pastOrders } = useOrders();
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
  const [avatarStatus, setAvatarStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/student/sign-in');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.id) return;

    if (file.size > 2_000_000) {
      setAvatarStatus('Use an image under 2MB.');
      return;
    }

    setAvatarStatus('Saving photo...');
    try {
      // 1. Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // 3. Update DB
      const { error: dbError } = await supabase
        .from('student_profiles')
        .update({ id_photo_url: publicUrl })
        .eq('id', user.id);

      if (dbError) {
        throw dbError;
      }

      setAvatarPreview(publicUrl);
      setUser((prev) => prev ? { ...prev, avatar: publicUrl } : prev);
      setAvatarStatus('Photo saved.');
    } catch (error) {
      console.error(error);
      setAvatarStatus('Photo could not be saved.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full mx-auto flex flex-col gap-6"
    >
      <section className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm flex flex-col items-center text-center relative">
        <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {avatarPreview ? (
            <Image width={96} height={96} className="rounded-full object-cover border-4 border-white shadow-md transition-opacity group-hover:opacity-80 shrink-0" src={avatarPreview} alt={user.fullName} />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md" />
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <button type="button" className="absolute bottom-0 right-0 bg-white border border-[#F3F4F6] rounded-full p-2 text-[#FF6B00] hover:bg-[#FFF8F6] transition-colors shadow-sm active:scale-90 z-10">
            <Edit3 className="w-4 h-4" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>
        {avatarStatus && <p className="text-xs font-semibold text-[#FF6B00] mb-2">{avatarStatus}</p>}
        <h2 className="font-display font-extrabold text-2xl tracking-tight text-[#111827] mb-1">{user.fullName}</h2>
        <p className="text-xs text-gray-400 font-medium mb-3">{user.email}</p>
        {user.isVerified ? (
          <div className="inline-flex items-center gap-1.5 bg-[#FF6B00]/10 text-[#FF6B00] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <UserCheck className="w-4 h-4" />
            <span>Verified Student Status</span>
          </div>
        ) : (
          <Link href="/student/verify" className="bg-[#E11D48] text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-[#c1153a]">
            Unverified Student Status
          </Link>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-5 shadow-sm flex flex-col justify-between items-start hover:shadow transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center mb-4">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-black text-[#5a4136] uppercase tracking-wider mb-1">Total Savings</span>
            <Price amount={pastOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.deal.originalPrice - o.deal.dealPrice), 0)} size="lg" className="text-[#FF6B00]" />
          </div>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-5 shadow-sm flex flex-col justify-between items-start hover:shadow transition-shadow">
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#E11D48] flex items-center justify-center mb-4">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-black text-[#5a4136] uppercase tracking-wider mb-1">Meals Enjoyed</span>
            <span className="text-2xl font-extrabold tracking-tight text-[#111827]">{pastOrders.filter(o => o.status === 'Completed').length} meals</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display font-extrabold text-lg text-[#111827] ml-1">Past Transactions</h3>
        <div className="flex flex-col gap-3">
          {pastOrders.map((order) => {
            const inner = (
              <>
                <Image src={order.deal.image} alt={order.deal.title} width={56} height={56} className="rounded-lg object-cover shrink-0 border" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-sm text-[#111827] truncate">{order.deal.title}</h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">{order.date} &bull; {order.time}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    order.status === 'Completed' ? 'bg-green-50 text-green-600'
                    : order.status === 'Cancelled' ? 'bg-red-50 text-red-600'
                    : 'bg-[#FF6B00]/10 text-[#FF6B00] animate-pulse'
                  }`}>{order.status}</span>
                  <Price amount={order.totalPaid} size="sm" />
                </div>
              </>
            );

            const className = `bg-white border border-[#F3F4F6] rounded-xl p-4 flex gap-4 items-center shadow-sm transition-all duration-150 ${
                order.status === 'Active' ? 'border-[#FF6B00] bg-[#FFF8F6] hover:shadow-md block' : ''
              }`;

            if (order.status === 'Active') {
              return <Link key={order.id} href="/student/orders" className={className}>{inner}</Link>;
            }
            return <div key={order.id} className={className}>{inner}</div>;
          })}
        </div>
      </section>

      <button onClick={handleLogout} className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-[#5a4136] font-bold rounded-lg flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all text-xs">
        <LogOut className="w-4 h-4 text-[#E11D48]" />
        <span>Log Out of Student Account</span>
      </button>
    </motion.div>
  );
}
