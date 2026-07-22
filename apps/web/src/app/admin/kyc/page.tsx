'use client';

import { useState, useEffect } from 'react';
import { getKycVerifications } from '@/lib/adminApi';

interface KycUser {
  id: string;
  email: string;
  username: string;
  status: string;
}

interface KycVerification {
  id: string;
  userId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  level: string;
  documentType: string;
  createdAt: string;
  updatedAt: string;
  user: KycUser;
}

const STATUS_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  APPROVED: {
    bg: 'bg-green-500/10 border-green-500/20',
    dot: 'bg-green-400',
    label: 'Approved',
  },
  IN_PROGRESS: {
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    dot: 'bg-yellow-400',
    label: 'In Progress',
  },
  PENDING: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    dot: 'bg-blue-400',
    label: 'Pending',
  },
  REJECTED: {
    bg: 'bg-red-500/10 border-red-500/20',
    dot: 'bg-red-400',
    label: 'Rejected',
  },
};

const DOCUMENT_LABELS: Record<string, string> = {
  PASSPORT: 'Passport',
  DRIVERS_LICENSE: "Driver's License",
  ID_CARD: 'ID Card',
  UTILITY_BILL: 'Utility Bill',
  SELFIE: 'Selfie',
};

const LEVEL_LABELS: Record<string, string> = {
  BASIC: 'Basic',
  ADVANCED: 'Advanced',
  VERIFIED: 'Verified',
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    bg: 'bg-gray-500/10 border-gray-500/20',
    dot: 'bg-gray-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function Avatar({ username }: { username: string }) {
  const initials = getInitials(username);
  return (
    <div className="w-9 h-9 rounded-lg bg-gradient-miami flex items-center justify-center text-xs font-bold text-white shrink-0">
      {initials}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-miami-pink border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading KYC verifications...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Failed to load verifications</h2>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-gradient-miami text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-miami-pink/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-miami/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-miami-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">No verifications found</h2>
        <p className="text-sm text-gray-400">
          All KYC verifications have been processed. New submissions will appear here.
        </p>
      </div>
    </div>
  );
}

export default function AdminKycPage() {
  const [verifications, setVerifications] = useState<KycVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getKycVerifications();
      setVerifications(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchVerifications} />;
  if (!verifications.length) return <EmptyState />;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white mb-1">
            KYC Verifications
          </h1>
          <p className="text-sm text-gray-400">
            Review and manage identity verification submissions
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm text-gray-400">Total:</span>
          <span className="text-sm font-bold text-white">{verifications.length}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: 'Pending',
            count: verifications.filter((v) => v.status === 'PENDING').length,
            color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          },
          {
            label: 'In Progress',
            count: verifications.filter((v) => v.status === 'IN_PROGRESS').length,
            color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          },
          {
            label: 'Approved',
            count: verifications.filter((v) => v.status === 'APPROVED').length,
            color: 'bg-green-500/10 text-green-400 border-green-500/20',
          },
          {
            label: 'Rejected',
            count: verifications.filter((v) => v.status === 'REJECTED').length,
            color: 'bg-red-500/10 text-red-400 border-red-500/20',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-4 ${stat.color}`}
          >
            <p className="text-2xl font-heading font-bold mb-1">{stat.count}</p>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="relative">
        {/* Neon glow behind table */}
        <div className="absolute -inset-1 bg-gradient-miami/10 rounded-2xl blur-xl opacity-30" />
        <div className="relative rounded-2xl border border-white/10 bg-casino-dark/90 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    Document Type
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    Level
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    Date
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verifications.map((verification) => {
                  const statusStyle = STATUS_STYLES[verification.status] ?? STATUS_STYLES.PENDING;
                  return (
                    <tr
                      key={verification.id}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar username={verification.user.username} />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {verification.user.username}
                            </p>
                            <p className="text-xs text-gray-500">ID: {verification.userId.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-300">{verification.user.email}</p>
                      </td>

                      {/* Document Type */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-300">
                          {DOCUMENT_LABELS[verification.documentType] ?? verification.documentType}
                        </p>
                      </td>

                      {/* Level */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-miami/10 text-miami-pink border border-miami-pink/20">
                          {LEVEL_LABELS[verification.level] ?? verification.level}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={verification.status} />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-300">{formatDate(verification.createdAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all">
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
