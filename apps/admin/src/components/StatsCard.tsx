'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'amber' | 'blue' | 'green' | 'purple' | 'red';
}

const COLOR_MAP = {
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
  green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
  red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
};

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  const { t } = useI18n();

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${COLOR_MAP[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          <span className="text-sm text-gray-500 ml-1">{t('common.vsLastPeriod', 'vs last period')}</span>
        </div>
      )}
    </div>
  );
}