import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = 'indigo',
}) => {
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600',
      border: 'border-slate-200/80',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600',
      border: 'border-slate-200/80',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600',
      border: 'border-slate-200/80',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600',
      border: 'border-slate-200/80',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600',
      border: 'border-slate-200/80',
    },
  };

  const colors = colorMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className={`p-5 bg-white rounded-xl border ${colors.border} shadow-xs hover:shadow-lg transition-all duration-300 group cursor-default`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-lg ${colors.iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 font-normal">{subtitle}</p>
      )}
    </motion.div>
  );
};
