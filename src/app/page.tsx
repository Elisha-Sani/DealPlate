'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Utensils, Store } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans">
      {/* Left side: Hero Image (2/3 width on large screens) */}
      <div className="relative w-full lg:w-2/3 h-[40vh] lg:h-screen">
        <Image 
          src="/images/hero.png" 
          alt="Delicious rescued meals" 
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 to-transparent flex items-end lg:items-center p-8 lg:p-16">
          <div className="max-w-xl text-white">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl lg:text-5xl font-display font-extrabold mb-4"
            >
              Delicious Meals. <br className="hidden lg:block"/>
              Massive Discounts.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl font-medium text-white/90"
            >
              Join the movement to eliminate food waste on campus. Rescue high-quality surplus food from your favorite vendors at half the price.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right side: Role Selector (1/3 width on large screens) */}
      <div className="w-full lg:w-1/3 flex flex-col justify-center px-8 py-12 lg:px-12 bg-[#FFF8F6]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="text-center mb-10">
            <h1 className="font-display font-black text-5xl tracking-tight text-[#FF6B00] mb-3">
              DealPlate
            </h1>
            <p className="text-gray-600 font-medium">Select your role to continue</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push('/student/sign-in')}
              className="group relative flex items-center p-6 bg-white border-2 border-[#FF6B00]/10 hover:border-[#FF6B00] rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-orange-50 text-[#FF6B00] rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#FF6B00] group-hover:text-white transition-colors">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#111827]">I am a Student</h3>
                <p className="text-sm text-gray-500 font-medium">Discover and buy discounted meals</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/vendor/sign-in')}
              className="group relative flex items-center p-6 bg-white border-2 border-gray-100 hover:border-[#111827] rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-gray-50 text-[#111827] rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#111827] group-hover:text-white transition-colors">
                <Store className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#111827]">I am a Vendor</h3>
                <p className="text-sm text-gray-500 font-medium">List surplus food & increase revenue</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
