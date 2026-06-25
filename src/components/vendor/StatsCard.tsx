interface StatsCardProps {
  title: string;
  value: string | number;
  emoji: string;
  subtitle?: string;
  subtitleColor?: string;
}

export default function StatsCard({ title, value, emoji, subtitle, subtitleColor }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">{title}</h3>
        <div className="w-8 h-8 rounded bg-orange-50 text-[#FF6B00] flex items-center justify-center">
          <span className="font-bold text-lg">{emoji}</span>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold text-[#1E293B]">{value}</span>
        {subtitle && (
          <span className={`text-sm font-semibold mb-1 ${subtitleColor || 'text-gray-500'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
