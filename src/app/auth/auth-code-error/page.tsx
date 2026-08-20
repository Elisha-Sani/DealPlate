'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

export default function AuthCodeErrorPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto my-auto py-8 px-4 text-center"
    >
      <div className="inline-flex p-4 rounded-full bg-red-50 mb-4 text-red-600">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="font-display font-extrabold text-2xl tracking-tight text-[#111827] mb-2">
        Link Expired or Invalid
      </h2>
      <p className="text-[#5a4136] text-sm mb-8">
        This sign-in or password reset link is no longer valid. Links expire after a short time and can
        only be used once — request a new one to continue.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push('/student/sign-in')}
          className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md"
        >
          Back to Student Sign In
        </button>
        <button
          onClick={() => router.push('/vendor/sign-in')}
          className="w-full h-12 border border-[#FF6B00] text-[#FF6B00] rounded-lg font-bold hover:bg-[#FF6B00]/5 active:scale-95 transition-all"
        >
          Back to Vendor Sign In
        </button>
      </div>
    </motion.div>
  );
}
