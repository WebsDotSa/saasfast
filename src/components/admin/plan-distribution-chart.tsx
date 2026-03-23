'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlanDistributionChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#6c63ff', '#00d4aa', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
        لا توجد بيانات
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, 'اشتراك']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
