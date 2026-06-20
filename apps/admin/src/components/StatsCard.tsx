'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: 'amber' | 'blue' | 'green' | 'purple' | 'red';
}

const COLOR_MAP = {
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-400',
    border: 'border-green-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    border: 'border-red-500/20',
  },
};

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  const colors = COLOR_MAP[color];
  const isPositive = change >= 0;

  return (
    <div className={`bg-gray-900 rounded-xl p-5 border border-gray-800 card-hover ${colors.border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1 mt-2">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-green-400" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-xs text-gray-500 ml-1">vs last period</span>
      </div>
    </div>
  );
}
