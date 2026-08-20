'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function VendorPickup() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleKeyPress = (btn: string | number) => {
    setError('');
    setSuccess('');
    if (btn === 'C') {
      setCode('');
    } else if (btn === '⌫') {
      setCode((prev) => prev.slice(0, -1));
    } else {
      if (code.length < 6) {
        setCode((prev) => prev + String(btn));
      }
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Single atomic UPDATE guarded by status='Active' — avoids the
      // fetch-then-update race where two terminals could both confirm the
      // same code between the read and the write.
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Completed' })
        .eq('pickup_code', code)
        .eq('status', 'Active')
        .select('id');

      if (updateError) {
        setError('Failed to update order status.');
        setLoading(false);
        return;
      }

      if (!updated || updated.length === 0) {
        setError('Failed: Invalid or already completed pickup code.');
        setLoading(false);
        return;
      }

      setSuccess('Meal Confirmed! Order Completed.');
      setTimeout(() => {
        router.push('/vendor/dashboard');
      }, 1500);

    } catch (err) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex items-center justify-center bg-[#F9FAFB]/90 backdrop-blur-sm p-4 z-50 absolute inset-0"
    >
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-lg max-w-[400px] w-full text-center relative">
        <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl mx-auto flex items-center justify-center mb-6">
          <span className="text-3xl">🍽️</span>
        </div>
        <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Meal Pickup</h2>
        <p className="text-sm text-gray-500 mb-6">Ask the student for their 6-digit pickup code</p>

        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`w-12 h-14 rounded-lg border flex items-center justify-center text-2xl font-black text-[#1E293B] transition-colors
                ${code[i] ? 'border-[#FF6B00] bg-orange-50' : 'border-[#E2E8F0] bg-white'}`}
            >
              {code[i] || ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 text-sm font-bold p-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'C'].map((btn) => (
            <button 
              key={String(btn)} 
              onClick={() => handleKeyPress(btn)}
              className="h-12 rounded-lg font-bold text-xl text-[#1E293B] bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm"
            >
              {btn}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading || code.length !== 6 || !!success}
          className="w-full h-14 bg-[#FF6B00] hover:bg-[#e66000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold mb-3 flex items-center justify-center transition-colors"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Meal Collection'}
        </button>
        <button
          onClick={() => router.push('/vendor/dashboard')}
          disabled={loading || !!success}
          className="w-full h-12 text-gray-500 font-bold hover:bg-gray-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
