'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Eye, AlertTriangle, User } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

interface KycSubmission {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  documentType: string;
  status: string;
  submittedAt: string;
  riskLevel: string;
  flags: string[];
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400 bg-green-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  high: 'text-red-400 bg-red-500/10',
};

export default function KycQueue() {
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const res = await adminApi.kyc.list();
        const data = Array.isArray(res.data) ? res.data : [];
        setSubmissions(
          data.map((k: any) => ({
            id: k.id,
            userId: k.userId,
            username: k.user?.username || 'unknown',
            firstName: k.user?.username || 'Unknown',
            documentType: k.documentType || '—',
            status: k.status === 'IN_PROGRESS' ? 'pending' : k.status === 'APPROVED' ? 'approved' : k.status === 'REJECTED' ? 'rejected' : 'pending',
            submittedAt: new Date(k.submittedAt || k.createdAt).toLocaleDateString(),
            riskLevel: k.status === 'IN_PROGRESS' && !k.documentFrontUrl ? 'high' : 'low',
            flags: [],
          }))
        );
      } catch (err) {
        console.error('Failed to fetch KYC:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKyc();
  }, []);

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
            <h2 className="text-lg font-semibold">{t('kyc.title', 'KYC Queue')}</h2>
          </div>
          <div className="flex items-center gap-2">
            {highRiskCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                {highRiskCount} {t('kyc.highRisk', 'high risk')}
              </span>
            )}
            <span className="badge badge-warning">{pendingCount} {t('kyc.pending', 'pending')}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KYC List */}
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {submissions.length === 0 && !loading && (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                {t('kyc.noSubmissions', 'No KYC submissions found.')}
              </div>
            )}
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
                        {submission.firstName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{submission.firstName}</p>
                          <span className={`badge text-[10px] ${RISK_COLORS[submission.riskLevel] || RISK_COLORS.low}`}>
                            {submission.riskLevel} {t('kyc.risk', 'risk')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          @{submission.username} • {submission.documentType} • {submission.submittedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedId(selectedId === submission.id ? null : submission.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                        title={t('kyc.viewDetails', 'View details')}
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => approve(submission.id)}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                        title={t('kyc.approve', 'Approve')}
                      >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </button>
                      <button
                        onClick={() => reject(submission.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title={t('kyc.reject', 'Reject')}
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedId === submission.id && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">{t('kyc.userId', 'User ID')}:</span>
                          <span className="ml-1 text-gray-300">{submission.userId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('kyc.document', 'Document')}:</span>
                          <span className="ml-1 text-gray-300">{submission.documentType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('kyc.submitted', 'Submitted')}:</span>
                          <span className="ml-1 text-gray-300">{submission.submittedAt}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('kyc.riskLevel', 'Risk Level')}:</span>
                          <span className={`ml-1 ${submission.riskLevel === 'high' ? 'text-red-400' : submission.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                            {submission.riskLevel}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-700">
                        <button className="flex-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors">
                          {t('kyc.approve', 'Approve')}
                        </button>
                        <button className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
                          {t('kyc.reject', 'Reject')}
                        </button>
                        <button className="flex-1 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-600 transition-colors">
                          {t('kyc.requestMoreInfo', 'Request More Info')}
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
              {t('kyc.viewAll', 'View all KYC submissions')} →
            </button>
          </div>
        </>
      )}
    </div>
  );
}