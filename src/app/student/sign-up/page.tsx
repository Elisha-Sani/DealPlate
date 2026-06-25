'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import type { SignUpFormData } from '@/types';

export default function StudentSignUp() {
  const router = useRouter();
  const [form, setForm] = useState<SignUpFormData>({ fullName: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.email || !form.password) {
      setError('Please fill in all details to snag deals.');
      return;
    }
    setError('');
    router.push('/student/verify');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-[420px] w-full mx-auto py-6"
    >
      <div className="text-center mb-8">
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-2">
          Join DealPlate
        </h2>
        <p className="text-[#5a4136] text-sm">Get exclusive student flash deals on local meals.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-1.5 ml-2">Full Name</label>
            <input type="text" placeholder="Jane Doe" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-1.5 ml-2">Phone Number (M-Pesa)</label>
            <input type="tel" placeholder="+254 7XX XXX XXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-1.5 ml-2">University Email</label>
            <input type="email" placeholder="student@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-1.5 ml-2">Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all" />
          </div>
          <button type="submit" className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-4">
            <span>Next: Verify Student Status</span>
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <button onClick={() => router.push('/student/sign-in')} className="text-xs font-bold text-[#FF6B00] hover:underline">
          Already have an account? Sign In
        </button>
      </div>
    </motion.div>
  );
}
