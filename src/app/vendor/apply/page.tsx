'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';

export default function VendorApply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F9FAFB]"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden p-8">
        {step < 3 && <StepIndicator currentStep={step} totalSteps={2} label={step === 1 ? 'Business Profile' : 'Account Security'} />}

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Vendor Application</h2>
            <p className="text-sm text-gray-500 mb-8 border-b border-[#E2E8F0] pb-4">Step 1: Business Profile Setup</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Legal Business Name</label>
                <input type="text" required placeholder="Enter legal business name" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Physical Address</label>
                <input type="text" required placeholder="Enter full physical address" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Target Campus Proximity</label>
                <select className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm bg-white">
                  <option>Select proximity</option>
                  <option>University of Nairobi (Main)</option>
                  <option>Strathmore University</option>
                  <option>Kenyatta University</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Contact Person Name</label>
                  <input type="text" required placeholder="Primary contact name" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Official Phone Number</label>
                  <input type="tel" required placeholder="+254 7XX XXX XXX" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-between items-center border-t border-[#E2E8F0] pt-6">
              <button type="button" onClick={() => router.push('/vendor/sign-in')} className="text-gray-500 font-medium hover:text-[#1E293B]">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000]">Next: Security &amp; Terms</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Account Details</h2>
            <p className="text-sm text-gray-500 mb-8 border-b border-[#E2E8F0] pb-4">Secure your vendor account credentials.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Business Email</label>
                <input type="email" required placeholder="admin@company.com" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E293B]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div className="flex items-start gap-3 border-t border-[#E2E8F0] pt-6">
                <input type="checkbox" required id="terms" className="mt-1 rounded text-[#FF6B00] focus:ring-[#FF6B00]" />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  I agree to DealPlate&apos;s Upfront M-Pesa Payment Processing terms.
                </label>
              </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
              <button type="button" onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-[#1E293B]">Back</button>
              <button type="submit" className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000]">Submit Application &rarr;</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <div className="w-8 h-8 rounded-full border-4 border-[#FF6B00] flex items-center justify-center">
                <span className="text-[#FF6B00] text-sm font-bold">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#1E293B] mb-3">Application Submitted</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
              Your vendor application is under review. You will receive an email notification once your account is verified and activated.
            </p>
            <button onClick={() => router.push('/vendor/sign-in')} className="px-6 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg font-medium hover:bg-gray-50">
              Return to Home
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
