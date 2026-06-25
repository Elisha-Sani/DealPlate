'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, ShieldAlert, Info } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import { UNIVERSITIES } from '@/lib/constants';

export default function StudentVerify() {
  const router = useRouter();
  const [university, setUniversity] = useState<string>(UNIVERSITIES[0]);
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber) {
      setError('Please enter your Student Registration Number.');
      return;
    }
    setError('');
    router.push('/student/upload-id');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-[420px] w-full mx-auto py-4"
    >
      <StepIndicator currentStep={1} totalSteps={2} label="Academic Details" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="font-display font-extrabold text-2xl tracking-tight text-[#111827] mb-2">
          Verify Your Status
        </h2>
        <p className="text-[#5a4136] text-sm">
          Exclusive deals are for verified students only. Tell us your campus.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2 ml-2">
              University / Institution
            </label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all"
            >
              {UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-1.5 ml-2">
              Student Registration Number
            </label>
            <input
              type="text"
              placeholder="SCCI/00586/2020"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all uppercase"
            />
            <p className="mt-2 text-xs text-gray-400 ml-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#FF6B00]" />
              Found on your official student ID card.
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
