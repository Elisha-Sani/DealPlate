'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFF8F6] flex flex-col items-center justify-center font-sans">
      <h1 className="font-display font-extrabold text-4xl tracking-tight text-[#FF6B00] mb-8">
        DealPlate
      </h1>
      <div className="flex gap-4">
        <button
          onClick={() => router.push('/student/sign-in')}
          className="px-8 py-4 bg-white text-[#111827] rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-md"
        >
          I am a Student
        </button>
        <button
          onClick={() => router.push('/vendor/sign-in')}
          className="px-8 py-4 bg-[#FF6B00] text-white rounded-xl font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md"
        >
          I am a Vendor
        </button>
      </div>
    </div>
  );
}
