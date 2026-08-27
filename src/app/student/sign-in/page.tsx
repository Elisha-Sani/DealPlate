'use client';

import { Suspense, useState } from 'react';
import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Only allow same-origin, relative redirect targets — mirrors the guard in
// auth/callback/route.ts to prevent an open redirect via ?next=. Returns
// null when there's no (valid) next param, e.g. when this page was served
// via middleware's masked rewrite rather than an explicit navigation.
function sanitizeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return null;
  }
  return next;
}

export default function StudentSignIn() {
  return (
    <Suspense fallback={null}>
      <StudentSignInForm />
    </Suspense>
  );
}

function StudentSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address above first, then click "Forgot?".');
      return;
    }
    setIsResetting(true);
    setError(null);
    setResetMessage(null);
    // No redirectTo needed here — the email template links directly to
    // /auth/reset-password with a token_hash, bypassing the code-exchange
    // callback entirely (see auth/reset-password/page.tsx for why).
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setIsResetting(false);
    setResetMessage(
      error ? error.message : 'If an account exists for that email, a reset link has been sent.'
    );
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      const next = sanitizeNext(searchParams.get('next'));
      if (next) {
        // Real navigation to this page (e.g. the header's "Sign In" button) —
        // send them where they were headed.
        router.push(next);
      } else {
        // Served via middleware's masked rewrite: the address bar already
        // shows the page the user wanted. Refresh so middleware re-evaluates
        // this now-authenticated request against that same URL.
        router.refresh();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[420px] w-full mx-auto my-auto py-8"
    >
      <div className="text-center mb-10">
        <div className="inline-flex p-4 rounded-full bg-[#FF6B00]/10 mb-4 text-[#FF6B00]">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-2">
          Welcome Back
        </h2>
        <p className="text-[#5a4136] text-sm max-w-xs mx-auto">
          Sign in to snag today&apos;s flash meals in Nairobi before they are gone.
        </p>
      </div>

      <form onSubmit={handleSignIn} className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        {resetMessage && (
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
            {resetMessage}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-2 ml-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@demo.com"
            className="w-full h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider ml-2">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-xs text-[#E11D48] font-bold hover:underline disabled:opacity-60"
            >
              {isResetting ? 'Sending...' : 'Forgot?'}
            </button>
          </div>
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
              <span>Secure Login</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-[#5a4136] mb-3">New to DealPlate?</p>
        <Link
          href="/student/sign-up"
          className="inline-flex items-center justify-center border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/5 px-8 h-12 rounded-lg font-bold active:scale-95 transition-all shadow-sm bg-white"
        >
          Create Student Account
        </Link>
      </div>
    </motion.div>
  );
}
