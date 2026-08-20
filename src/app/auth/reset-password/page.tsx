'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    // Verify the recovery token directly — this works from any browser or
    // device, unlike the code-exchange flow, which requires a matching
    // "code verifier" cookie set in the same browser that requested the
    // reset (breaks whenever the email link is opened somewhere else, e.g.
    // a different device, an email client's in-app browser, or a security
    // scanner pre-fetching the link).
    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
        setHasRecoverySession(!error);
      });
      return;
    }

    // Fallback: an already-established session (e.g. page refresh after
    // verification already succeeded above).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(Boolean(session));
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/student/sign-in'), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[420px] w-full mx-auto my-auto py-8 px-4"
    >
      <div className="text-center mb-10">
        <div className="inline-flex p-4 rounded-full bg-[#FF6B00]/10 mb-4 text-[#FF6B00]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-2">
          Set a New Password
        </h2>
        <p className="text-[#5a4136] text-sm max-w-xs mx-auto">
          Choose a new password for your DealPlate account.
        </p>
      </div>

      {hasRecoverySession === null ? (
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md flex items-center justify-center gap-3 text-sm text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-[#FF6B00] rounded-full animate-spin" />
          Verifying your reset link...
        </div>
      ) : hasRecoverySession === false ? (
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md text-center text-sm text-red-600">
          This password reset link is invalid or has expired. Please request a new one from the sign-in page.
        </div>
      ) : success ? (
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md text-center text-sm text-green-700">
          Password updated. Redirecting you to sign in...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2 ml-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-lg border border-gray-200 bg-white pl-4 pr-11 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2 ml-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}
