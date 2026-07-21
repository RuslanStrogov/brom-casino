'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { adminApi } from '../../lib/api';
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
  isReal?: boolean;
  data?: any;
}

const MOCK_REPORTS: Report[] = [
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
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [revenueReport, setRevenueReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchRevenue = async () => {
      try {
        const res = await adminApi.reports.getFinancial();
        const data = res.data;
        const totalNumeric = Number(data.netDeposits || data.deposits || 0);
        const sizeMB = Math.max(0.5, Math.round(totalNumeric / 100000 * 10) / 10);
        setRevenueReport({
          id: 'r-001-revenue',
          name: 'Monthly Financial Report',
          type: 'financial',
          period: `${new Date(data.period?.from).toLocaleDateString()} – ${new Date(data.period?.to).toLocaleDateString()}`,
          generatedAt: 'Real-time',
          size: `${sizeMB} MB`,
          status: 'ready',
          isReal: true,
          data,
        });
      } catch (err) {
        console.error('Failed to fetch revenue report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [isAuthenticated]);

  const allReports = revenueReport ? [revenueReport, ...MOCK_REPORTS] : MOCK_REPORTS;
  const filtered = typeFilter === 'all' ? allReports : allReports.filter(r => r.type === typeFilter);
  const readyCount = allReports.filter(r => r.status === 'ready').length;
  const generatingCount = allReports.filter(r => r.status === 'generating').length;

  if (authLoading) {
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
          value={readyCount.toString()}
          change={0}
          icon={<FileText className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Generating"
          value={generatingCount.toString()}
          change={0}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Financial Reports"
          value={allReports.filter(r => r.type === 'financial').length.toString()}
          change={loading ? 0 : undefined}
          icon={<FileSpreadsheet className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Size"
          value="9.8 MB"
          change={0}
          icon={<Download className="w-4 h-5" />}
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
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map(report => {
              const Icon = TYPE_ICONS[report.type] || FileText;
              const isGenerating = report.status === 'generating';
              return (
                <div key={report.id} className={`px-5 py-4 hover:bg-gray-800/30 transition-colors ${report.isReal ? 'bg-amber-500/5' : ''}`}>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{report.name}</p>
                          {report.isReal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">LIVE</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{TYPE_LABELS[report.type]}</span>
                          <span>•</span>
                          <span>{report.period}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                          <span>•</span>
                          <span>{report.generatedAt}</span>
                        </div>
                        {report.isReal && report.data && (
                          <div className="flex items-center gap-4 mt-1.5 text-[11px] text-gray-400">
                            <span>Deposits: <span className="text-green-400">${report.data.deposits?.toLocaleString()}</span></span>
                            <span>Withdrawals: <span className="text-red-400">${report.data.withdrawals?.toLocaleString()}</span></span>
                            <span>GGR: <span className="text-amber-400">${report.data.grossGamingRevenue?.toLocaleString()}</span></span>
                            <span>RTP: <span className="text-blue-400">{report.data.rtp?.toFixed(1)}%</span></span>
                          </div>
                        )}
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
        )}
      </div>
    </div>
  );
}