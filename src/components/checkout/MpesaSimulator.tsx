'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Lock, CheckCircle, Loader2 } from 'lucide-react';
import Price from '@/components/ui/Price';

interface MpesaSimulatorProps {
  amount: number;
  phoneNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MpesaSimulator({
  amount,
  phoneNumber,
  onSuccess,
  onCancel,
}: MpesaSimulatorProps) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1200);
    const timer2 = setTimeout(() => setStep(3), 3200);
    const timer3 = setTimeout(() => setStep(4), 4500);
    const timer4 = setTimeout(() => onSuccess(), 5700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in duration-200">
        {/* Header Icon */}
        <div className="mb-4 relative">
          {step < 4 ? (
            <div className="w-16 h-16 rounded-full bg-[#26B24B]/10 text-[#26B24B] flex items-center justify-center relative">
              <Loader2 className="w-16 h-16 absolute text-[#26B24B]/20 animate-spin" />
              <Smartphone className="w-7 h-7 text-[#26B24B] animate-bounce" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#26B24B] text-white flex items-center justify-center animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <h3 className="font-display font-extrabold text-xl text-[#111827] mb-1">
          M-Pesa Checkout
        </h3>
        <p className="text-sm text-gray-500 mb-4">Securing your flash meal deal</p>

        {/* Amount */}
        <div className="bg-[#F3F4F6] rounded-xl p-3 w-full mb-6 flex flex-col items-center">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Total Amount Due
          </span>
          <Price amount={amount} size="xl" className="text-[#FF6B00]" />
        </div>

        {/* Step Content */}
        <div className="w-full flex flex-col gap-2 min-h-[96px] justify-center mb-6">
          {step === 1 && (
            <div className="animate-pulse">
              <p className="text-sm font-semibold text-[#111827]">Connecting to Daraja API...</p>
              <p className="text-xs text-gray-400">Initiating secure Safaricom handshake</p>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#26B24B] animate-pulse">
                STK Push Sent Successfully!
              </p>
              <p className="text-xs text-[#111827] font-medium">
                Check handset of <span className="underline">{phoneNumber}</span>
              </p>
              <p className="text-xs text-red-500 font-bold">
                Please enter your M-Pesa PIN when prompted
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="animate-pulse">
              <p className="text-sm font-semibold text-[#111827]">Verifying M-Pesa Receipts...</p>
              <p className="text-xs text-gray-400">Listening to Safaricom IPN callback</p>
            </div>
          )}
          {step === 4 && (
            <div className="text-[#26B24B] font-bold scale-105 duration-200 transition-all">
              <p className="text-base">Ksh {amount} Received!</p>
              <p className="text-xs text-gray-500 font-normal">Safaricom Receipt code generated</p>
            </div>
          )}
        </div>

        {/* Secure footer */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3.5 h-3.5 text-[#26B24B]" />
          <span>Safaricom Secure Merchant Payment</span>
        </div>

        {step < 3 && (
          <button
            onClick={onCancel}
            className="mt-4 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
          >
            Cancel and edit number
          </button>
        )}
      </div>
    </div>
  );
}
