import React from 'react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

export default function StatsCard({ icon, label, value }: StatsCardProps) {
  const formattedValue = typeof value === 'number' && value >= 1000 
    ? (value / 1000).toFixed(1) + 'k' 
    : value;

  return (
    <div className="bg-white/5 border border-glassBorder rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10">
      <div className="flex items-center gap-2 text-textSecondary text-sm font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-textPrimary tabular-nums">
        {formattedValue}
      </div>
    </div>
  );
}
