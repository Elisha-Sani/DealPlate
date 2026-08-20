'use client';

import { Clock } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

interface TimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  variant?: 'badge' | 'box' | 'inline';
  className?: string;
}

export default function Timer({
  initialSeconds,
  onExpire,
  variant = 'badge',
  className = '',
}: TimerProps) {
  const { formatted } = useCountdown(initialSeconds, onExpire);

  if (variant === 'inline') {
    return (
      <span className={cn('font-bold text-[#111827] tabular-nums', className)}>
        {formatted}
      </span>
    );
  }

  if (variant === 'box') {
    return (
      <div
        className={cn(
          'bg-[#E11D48]/10 border border-[#E11D48]/30 px-6 py-4 rounded-xl text-center shadow-inner',
          className
        )}
      >
        <div className="text-4xl font-display font-extrabold text-[#E11D48] tracking-widest tabular-nums animate-pulse">
          {formatted}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 bg-[#F3F4F6] text-[#5a4136] px-3 py-1.5 rounded-full font-sans text-xs font-semibold',
        className
      )}
    >
      <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
      <span className="tabular-nums">{formatted}</span>
    </div>
  );
}
