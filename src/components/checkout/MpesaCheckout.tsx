'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, Lock, XCircle, Loader2 } from 'lucide-react';
import Price from '@/components/ui/Price';

interface MpesaCheckoutProps {
  dealId: string;
  amount: number;
  phoneNumber: string;
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
}

type Phase = 'initiating' | 'waiting' | 'failed' | 'error';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_SECONDS = 90;

export default function MpesaCheckout({ dealId, amount, phoneNumber, onSuccess, onCancel }: MpesaCheckoutProps) {
  const [phase, setPhase] = useState<Phase>('initiating');
  const [message, setMessage] = useState('Sending payment request to your phone...');
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const stopTimers = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };

    const start = async () => {
      const { initiateMpesaPayment } = await import('@/app/actions/initiateMpesaPayment');
      const result = await initiateMpesaPayment(dealId, phoneNumber);

      if (cancelled) return;

      if (!result.success || !result.checkoutRequestId) {
        setPhase('error');
        setMessage(result.error || 'Could not start payment. Please try again.');
        return;
      }

      setPhase('waiting');
      setMessage('Check your phone and enter your M-Pesa PIN when prompted.');
      setSecondsLeft(TIMEOUT_SECONDS);

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/mpesa/status?checkoutRequestId=${result.checkoutRequestId}`);
          if (!res.ok) return;
          const data = await res.json();

          if (data.status === 'completed') {
            stopTimers();
            onSuccess(data.order_id);
          } else if (data.status === 'failed') {
            stopTimers();
            setPhase('failed');
            setMessage(data.result_description || 'Payment was not completed.');
          }
        } catch {
          // transient network error while polling — try again next tick
        }
      }, POLL_INTERVAL_MS);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopTimers();
            setPhase('failed');
            setMessage(
              'This is taking longer than expected. If you completed the payment on your phone, ask the vendor to confirm it — they can do this from their Order Queue.'
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    start();

    return () => {
      cancelled = true;
      stopTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
        <div className="mb-4 relative">
          {phase === 'failed' || phase === 'error' ? (
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#26B24B]/10 text-[#26B24B] flex items-center justify-center relative">
              <Loader2 className="w-16 h-16 absolute text-[#26B24B]/20 animate-spin" />
              <Smartphone className="w-7 h-7 text-[#26B24B]" />
            </div>
          )}
        </div>

        <h3 className="font-display font-extrabold text-xl text-[#111827] mb-1">M-Pesa Checkout</h3>
        <p className="text-sm text-gray-500 mb-4">Securing your flash meal deal</p>

        <div className="bg-[#F3F4F6] rounded-xl p-3 w-full mb-6 flex flex-col items-center">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Amount Due</span>
          <Price amount={amount} size="xl" className="text-[#FF6B00]" />
        </div>

        <div className="w-full flex flex-col gap-1 min-h-16 justify-center mb-4">
          <p
            className={`text-sm font-semibold ${
              phase === 'failed' || phase === 'error' ? 'text-red-600' : 'text-[#111827]'
            }`}
          >
            {message}
          </p>
          {phase === 'waiting' && (
            <p className="text-xs text-gray-400">Sent to {phoneNumber}</p>
          )}
        </div>

        {phase === 'waiting' && (
          <div className="w-full mb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-1.5">
              <span>Waiting for confirmation</span>
              <span className="tabular-nums text-[#111827]">{formattedTime}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#26B24B] rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / TIMEOUT_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4">
          <Lock className="w-3.5 h-3.5 text-[#26B24B]" />
          <span>Safaricom Secure Merchant Payment</span>
        </div>

        {(phase === 'failed' || phase === 'error') ? (
          <button
            onClick={onCancel}
            className="w-full h-11 rounded-lg bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#e66000]"
          >
            Try Again
          </button>
        ) : (
          <button onClick={onCancel} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
