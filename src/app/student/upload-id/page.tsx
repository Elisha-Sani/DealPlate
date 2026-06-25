'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Camera, ShieldAlert, UserCheck } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import { useUser } from '@/providers/UserProvider';

export default function StudentUploadId() {
  const router = useRouter();
  const { login } = useUser();
  const [idUploaded, setIdUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!idUploaded) {
      setError('Please click the upload card or drag-drop to upload your student ID.');
      return;
    }
    setError('');
    login({ isVerified: true });
    router.push('/student/explore');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-[420px] w-full mx-auto py-4"
    >
      <StepIndicator currentStep={2} totalSteps={2} label="Academic Details" />

      <div className="text-center mb-8">
        <h2 className="font-display font-extrabold text-2xl tracking-tight text-[#111827] mb-2 animate-pulse">
          Upload Student ID
        </h2>
        <p className="text-[#5a4136] text-sm max-w-sm mx-auto">
          Take a clear photo of your current student ID card. Ensure name, photo, and valid dates are visible.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md flex flex-col">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setIdUploaded(true); setError(''); }}
          className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 gap-4 mb-5 transition-all active:scale-95 ${
            idUploaded
              ? 'border-green-500 bg-green-50/30'
              : 'border-[#FF6B00]/60 bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            idUploaded ? 'bg-green-500 text-white' : 'bg-[#FF6B00]/10 text-[#FF6B00]'
          }`}>
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-sm font-bold text-[#111827]">
              {idUploaded ? 'ID Photo Selected' : 'Upload Valid Student ID Photo'}
            </span>
            <span className="text-xs text-gray-400 block mt-1">
              {idUploaded ? 'ID_Student_UoN.jpg (420kb)' : 'Supports JPEG, PNG up to 5MB'}
            </span>
          </div>
        </button>

        <div className="bg-[#F3F4F6] rounded-xl p-4 flex gap-3 border border-gray-100">
          <div className="text-[#FF6B00] shrink-0 mt-0.5">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#5a4136] leading-relaxed">
            <strong>Access strictly limited:</strong> Information is only utilized to verify enrollment status. Secure encryption is applied.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md mt-6 flex items-center justify-center gap-2"
        >
          <span>Submit Application</span>
        </button>
      </div>
    </motion.div>
  );
}
