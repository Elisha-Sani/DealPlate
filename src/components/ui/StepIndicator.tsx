import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export default function StepIndicator({ currentStep, totalSteps, label }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
          Step {currentStep} of {totalSteps}
        </span>
        {label && (
          <span className="text-xs font-semibold text-[#5a4136]">{label}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn('bg-[#FF6B00] h-full rounded-full transition-all duration-500 shadow-sm')}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
