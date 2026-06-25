import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = 'Loading...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20', className)}>
      <div className="w-12 h-12 rounded-full border-4 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin mb-4" />
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}
