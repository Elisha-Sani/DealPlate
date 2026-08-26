'use client';

import { useEffect } from 'react';

export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Explore] Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1E293B] mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          We couldn&apos;t load the explore page. This is usually temporary.
        </p>
        <button
          onClick={() => reset()}
          className="w-full h-11 rounded-lg bg-[#FF6B00] text-white font-bold hover:bg-[#E55F00] transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
