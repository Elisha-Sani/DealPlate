'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface RevenueChartProps {
  todayRevenue: number;
}

export default function RevenueChart({ todayRevenue }: RevenueChartProps) {
  // Generate mock 7-day data, with today's revenue being dynamic
  const data = [
    { name: 'Mon', revenue: 12400 },
    { name: 'Tue', revenue: 21000 },
    { name: 'Wed', revenue: 18500 },
    { name: 'Thu', revenue: 27800 },
    { name: 'Fri', revenue: 32000 },
    { name: 'Sat', revenue: 41200 },
    { name: 'Today', revenue: todayRevenue > 0 ? todayRevenue : 45200 }, // Fallback if 0 for demo purposes
  ];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col p-6 h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[#1E293B]">Revenue Analytics</h3>
        <select className="bg-[#F8FAFC] border border-[#E2E8F0] text-sm rounded-lg px-3 py-1.5 outline-none text-gray-600 focus:ring-2 focus:ring-[#FF6B00]">
          <option>Last 7 Days</option>
          <option>This Month</option>
          <option>All Time</option>
        </select>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94A3B8' }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94A3B8' }} 
              tickFormatter={(val) => `Ksh ${val / 1000}k`}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#FF6B00', fontWeight: 'bold' }}
              formatter={(value: number | string | ReadonlyArray<number | string> | undefined) => [`Ksh ${Number(value || 0).toLocaleString()}`, 'Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#FF6B00" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
