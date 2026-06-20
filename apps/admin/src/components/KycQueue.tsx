'use client';

import React from 'react';
import { Shield, CheckCircle, XCircle, Clock, Eye, AlertTriangle, User } from 'lucide-react';

interface KycSubmission {
  id: string;
  userId: number;
  username: string;
  firstName: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  documentUrl?: string;
  selfieUrl?: string;
}

const MOCK_KYC: KycSubmission[] = [
  {
    id: 'kyc-001',
    userId: 3,
    username: 'lucky_player',
    firstName: 'Sarah',
    documentType: 'passport',
    status: 'pending',
    submittedAt: '2 hours ago',
    riskLevel: 'low',
    flags: [],
  },
  {
    id: 'kyc-002',
    userId: 12,
    username: 'ton_whale_99',
    firstName: 'Viktor',
    documentType: 'national_id',
    status: 'pending',
    submittedAt: '5 hours ago',
    riskLevel: 'medium',
    flags: ['VPN detected', 'Large deposits'],
  },
  {
    id: 'kyc-003',
    userId: 15,
    username: 'suspicious_account',
    firstName: 'Unknown',
    documentType: 'drivers_license',
    status: 'pending',
    submittedAt: '1 day ago',
    riskLevel: 'high',
    flags: ['Multiple accounts', 'Document mismatch', 'VPN detected'],
  },
  {
    id: 'kyc-004',
    userId: 22,
    username: 'regular_user',
    firstName: 'John',
    documentType: 'passport',
    status: 'pending',
    submittedAt: '1 day ago',
    riskLevel: 'low',
    flags: [],
  },
  {
    id: 'kyc-005',
    userId: 31,
    username: 'big_spender',
    firstName: 'Maria',
    documentType: 'passport',
    status: 'pending',
    submittedAt: '2 days ago',
    riskLevel: 'medium',
    flags: ['High withdrawal request'],
  },
];

const RISK_COLORS = {
  low: 'text-green-400 bg-green-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  high: 'text-red-400 bg-red-500/10',
};

export default function KycQueue() {
  const [submissions, setSubmissions] = React.useState(MOCK_KYC);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const highRiskCount = submissions.filter(s => s.riskLevel === 'high').length;

  const approve = (id: string) => {
    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'approved' as const } : s))
    );
  };

  const reject = (id: string) => {
    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'rejected' as const } : s))
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">KYC Queue</h2>
          </div>
          <div className="flex items-center gap-2">
            {highRiskCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                {highRiskCount} high risk
              </span>
            )}
            <span className="badge badge-warning">{pendingCount} pending</span>
          </div>
        </div>
      </div>

      {/* KYC List */}
      <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
        {submissions
          .filter(s => s.status === 'pending')
          .map(submission => (
            <div
              key={submission.id}
              className={`px-5 py-3 transition-colors ${
                selectedId === submission.id ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                    {submission.firstName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{submission.firstName}</p>
                      <span className={`badge text-[10px] ${RISK_COLORS[submission.riskLevel]}`}>
                        {submission.riskLevel} risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      @{submission.username} • {submission.documentType.replace('_', ' ')} • {submission.submittedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedId(selectedId === submission.id ? null : submission.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => approve(submission.id)}
                    className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={() => reject(submission.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Flags */}
              {submission.flags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {submission.flags.map((flag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px]">
                      ⚠ {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded Details */}
              {selectedId === submission.id && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <span className="ml-1 text-gray-300">{submission.userId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Document:</span>
                      <span className="ml-1 text-gray-300">{submission.documentType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted:</span>
                      <span className="ml-1 text-gray-300">{submission.submittedAt}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Risk Level:</span>
                      <span className={`ml-1 ${submission.riskLevel === 'high' ? 'text-red-400' : submission.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {submission.riskLevel}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-700">
                    <button className="flex-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors">
                      Approve
                    </button>
                    <button className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
                      Reject
                    </button>
                    <button className="flex-1 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-600 transition-colors">
                      Request More Info
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-800">
        <button className="text-sm text-amber-400 hover:text-amber-300 w-full text-center">
          View all KYC submissions →
        </button>
      </div>
    </div>
  );
}
