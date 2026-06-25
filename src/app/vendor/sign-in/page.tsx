'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Store, Eye, EyeOff, Lock, Mail, HelpCircle } from 'lucide-react';

export default function VendorSignIn() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F9FAFB]"
    >
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 bg-[#1E293B] rounded-xl items-center justify-center mb-4 shadow-sm">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#1E293B] mb-2">DealPlate</h1>
        <p className="text-gray-500">Vendor Portal Authentication</p>
      </div>

      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="h-1.5 w-full bg-[#FF6B00]" />
        <div className="p-8">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Sign In to Dashboard</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to manage your inventory and deals.</p>

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 mb-6 flex gap-3 text-sm text-[#1E40AF]">
            <div className="mt-0.5"><HelpCircle className="w-5 h-5" /></div>
            <p>Note: Only verified vendor accounts can access the management dashboard.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); router.push('/vendor/dashboard'); }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" placeholder="vendor@example.com" required className="w-full h-11 pl-11 pr-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-[#1E293B]">Password</label>
                <button type="button" className="text-sm text-[#FF6B00] hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required className="w-full h-11 pl-11 pr-11 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E293B]">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="remember" className="rounded text-[#FF6B00] focus:ring-[#FF6B00]" />
              <label htmlFor="remember" className="text-sm text-gray-600">Remember my device for 30 days</label>
            </div>
            <button type="submit" className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all mt-4">
              Access Dashboard &rarr;
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 flex flex-col gap-2">
            <p>Need help? <button className="font-semibold text-[#1E293B]">Contact Vendor Support</button></p>
            <p>New vendor? <button onClick={() => router.push('/vendor/apply')} className="font-semibold text-[#FF6B00] hover:underline">Apply here</button></p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
