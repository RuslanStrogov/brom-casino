'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { FileText, Download, FileSpreadsheet, Printer, Calendar, Filter } from 'lucide-react';
import StatsCard from '../../components/StatsCard';

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'user' | 'game' | 'bonus' | 'compliance';
  period: string;
  generatedAt: string;
  size: string;
  status: 'ready' | 'generating' | 'failed';
}

const MOCK_REPORTS: Report[] = [
  { id: 'r-001', name: 'Monthly Financial Report', type: 'financial', period: 'June 2026', generatedAt: '2026-07-01 09:00', size: '2.4 MB', status: 'ready' },
  { id: 'r-002', name: 'User Activity Report', type: 'user', period: 'Q2 2026', generatedAt: '2026-07-01 08:30', size: '1.8 MB', status: 'ready' },
  { id: 'r-003', name: 'Game Performance Summary', type: 'game', period: 'June 2026', generatedAt: '2026-06-30', size: '3.1 MB', status: 'ready' },
  { id: 'r-004', name: 'Bonus Usage & ROI', type: 'bonus', period: 'June 2026', generatedAt: '2026-06-28', size: '890 KB', status: 'ready' },
  { id: 'r-005', name: 'KYC Compliance Report', type: 'compliance', period: 'Q2 2026', generatedAt: '2026-06-25', size: '1.2 MB', status: 'ready' },
  { id: 'r-006', name: 'Weekly Revenue Summary', type: 'financial', period: 'Week 27', generatedAt: '2 hours ago', size: '450 KB', status: 'generating' },
];

const TYPE_ICONS: Record<string, typeof FileText> = {
  financial: FileText,
  user: FileSpreadsheet,
  game: FileText,
  bonus: FileText,
  compliance: FileSpreadsheet,
};

const TYPE_LABELS: Record<string, string> = {
  financial: 'Financial',
  user: 'User Activity',
  game: 'Game Performance',
  bonus: 'Bonus Usage',
  compliance: 'Compliance',
};

export default function ReportsPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [typeFilter, setTypeFilter] = useState('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please log in to access this page</p>
      </div>
    );
  }

  const filtered = typeFilter === 'all' ? MOCK_REPORTS : MOCK_REPORTS.filter(r => r.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Generate and download financial, operational, and compliance reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium hover:from-amber-400 hover:to-amber-500 transition-all text-sm">
            <Calendar className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Available Reports"
          value={MOCK_REPORTS.filter(r => r.status === 'ready').length.toString()}
          change={0}
          icon={<FileText className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Generating"
          value={MOCK_REPORTS.filter(r => r.status === 'generating').length.toString()}
          change={0}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Financial Reports"
          value={MOCK_REPORTS.filter(r => r.type === 'financial').length.toString()}
          change={0}
          icon={<FileSpreadsheet className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Size"
          value="9.8 MB"
          change={0}
          icon={<Download className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="input w-44"
          >
            <option value="all">All Types</option>
            <option value="financial">Financial</option>
            <option value="user">User Activity</option>
            <option value="game">Game Performance</option>
            <option value="bonus">Bonus Usage</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* Report List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="divide-y divide-gray-800">
          {filtered.map(report => {
            const Icon = TYPE_ICONS[report.type] || FileText;
            const isGenerating = report.status === 'generating';
            return (
              <div key={report.id} className="px-5 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      report.type === 'financial' ? 'bg-green-500/10 text-green-400' :
                      report.type === 'user' ? 'bg-blue-500/10 text-blue-400' :
                      report.type === 'game' ? 'bg-purple-500/10 text-purple-400' :
                      report.type === 'bonus' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{TYPE_LABELS[report.type]}</span>
                        <span>•</span>
                        <span>{report.period}</span>
                        <span>•</span>
                        <span>{report.size}</span>
                        <span>•</span>
                        <span>{report.generatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGenerating ? (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      <>
                        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Download">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Print">
                          <Printer className="w-4 h-4 text-gray-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}