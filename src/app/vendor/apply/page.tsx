'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, HelpCircle, Loader2 } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import { submitVendorApplication } from '@/app/actions/submitVendorApplication';

export default function VendorApply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    address: '',
    campusProximity: 'University of Nairobi (Main)',
    contactName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await submitVendorApplication({
      businessName: form.businessName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      campusProximity: form.campusProximity,
      password: form.password,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Application could not be submitted.');
      return;
    }

    setStep(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F9FAFB]"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden p-8">
        {step < 3 && <StepIndicator currentStep={step} totalSteps={2} label={step === 1 ? 'Business Profile' : 'Account Security'} />}
        {error && <div className="mb-5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg p-3">{error}</div>}

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Vendor Application</h2>
            <p className="text-sm text-gray-500 mb-8 border-b border-[#E2E8F0] pb-4">Step 1: Business Profile Setup</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Legal Business Name</label>
                <input type="text" required value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} placeholder="Enter legal business name" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Physical Address</label>
                <input type="text" required value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Enter full physical address" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Target Campus Proximity</label>
                <select value={form.campusProximity} onChange={(e) => updateForm('campusProximity', e.target.value)} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm bg-white">
                  <option>University of Nairobi (Main)</option>
                  <option>Strathmore University</option>
                  <option>Kenyatta University</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Contact Person Name</label>
                  <input type="text" required value={form.contactName} onChange={(e) => updateForm('contactName', e.target.value)} placeholder="Primary contact name" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Official Phone Number</label>
                  <input type="tel" required value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="+254 7XX XXX XXX" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-between items-center border-t border-[#E2E8F0] pt-6">
              <Link href="/vendor/sign-in" className="inline-flex items-center justify-center text-gray-500 font-medium hover:text-[#1E293B]">Cancel</Link>
              <button type="submit" className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000]">Next: Security &amp; Terms</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitApplication}>
            <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Account Details</h2>
            <p className="text-sm text-gray-500 mb-8 border-b border-[#E2E8F0] pb-4">Secure your vendor account credentials.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Business Email</label>
                <input type="email" required value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="admin@company.com" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(e) => updateForm('password', e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E293B]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#FF6B00] outline-none text-sm" />
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
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#FF6B00] disabled:bg-orange-300 text-white rounded-lg font-bold hover:bg-[#e66000] flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Application
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <HelpCircle className="w-8 h-8 text-[#FF6B00]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E293B] mb-3">Application Submitted</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
              Your login account has been created and is pending superadmin approval. You can sign in after approval.
            </p>
            <Link href="/vendor/sign-in" className="inline-flex items-center justify-center px-6 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg font-medium hover:bg-gray-50">
              Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

