'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PriceProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-bold',
  lg: 'text-lg font-bold',
  xl: 'text-2xl font-extrabold',
  '2xl': 'text-3xl font-extrabold',
} as const;

const amountClasses = {
  sm: 'text-sm font-bold',
  md: 'text-lg font-bold',
  lg: 'text-xl font-extrabold',
  xl: 'text-3xl font-extrabold',
  '2xl': 'text-4xl font-black',
} as const;

export default function Price({ amount, size = 'md', className = '' }: PriceProps) {
  return (
    <span className={cn('inline-flex items-baseline font-display text-inherit', className)}>
      <span className={cn(sizeClasses[size], 'text-[#5a4136] mr-1')}>Ksh</span>
      <span className={cn(amountClasses[size], 'tracking-tight text-[#111827]')}>
        {amount.toLocaleString()}
      </span>
    </span>
  );
}
