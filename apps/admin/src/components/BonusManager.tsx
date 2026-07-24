'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Users, Clock, Percent } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

interface Bonus {
  id: string;
  name: string;
  type: string;
  value: string;
  wageringRequirement: number;
  maxClaim: number;
  claimed: number;
  active: boolean;
  expiresAt?: string;
  conditions: string[];
}

const TYPE_LABELS: Record<string, string> = {
  WELCOME: 'Welcome',
  NO_DEPOSIT: 'No Deposit',
  DEPOSIT: 'Deposit',
  DAILY: 'Daily',
  FREE_SPINS: 'Free Spins',
  CASHBACK: 'Cashback',
  REFERRAL: 'Referral',
  LOYALTY: 'Loyalty',
  };
  export default function BonusManager() {
  const { t } = useI18n();
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBonuses = async () => {
      try {
        const res = await adminApi.bonuses.list();
        const data = Array.isArray(res.data) ? res.data : [];
        setBonuses(
          data.map((b: any) => ({
            id: b.id,
            name: b.name,
            type: b.type,
            value: b.amount ? `${b.amount}% up to ${b.maxAmount || '∞'} USDT` : b.freeSpins ? `${b.freeSpins} Free Spins` : '—',
            wageringRequirement: b.wageringRequirement,
            maxClaim: 1000,
            claimed: b.activeUsers || 0,
            active: b.status === 'ACTIVE',
            expiresAt: b.expiresAt || undefined,
            conditions: b.description ? [b.description] : [],
          }))
        );
      } catch (err) {
        console.error('Failed to fetch bonuses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBonuses();
  }, []);

  const toggleBonus = (id: string) => {
    setBonuses(prev =>
      prev.map(b => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const deleteBonus = (id: string) => {
    setBonuses(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">{t('bonuses.title', 'Bonuses')}</h2>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('bonuses.create', 'Create')}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Create Form */}
          {showCreate && (
            <div className="px-5 py-4 border-b border-gray-800 bg-gray-800/30">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={t('bonuses.bonusName', 'Bonus name')} className="input" />
                <select className="input">
                  <option value="welcome">{t('bonuses.welcome', 'Welcome')}</option>
                  <option value="deposit">{t('bonuses.deposit', 'Deposit')}</option>
                  <option value="free_spins">{t('bonuses.freeSpins', 'Free Spins')}</option>
                  <option value="cashback">{t('bonuses.cashback', 'Cashback')}</option>
                  <option value="referral">{t('bonuses.referral', 'Referral')}</option>
                  <option value="no_deposit">{t('bonuses.noDeposit', 'No Deposit')}</option>
                </select>
                <input placeholder={t('bonuses.valuePlaceholder', 'Value (e.g. 100% up to 500 TON)')} className="input col-span-2" />
                <input placeholder={t('bonuses.wageringPlaceholder', 'Wagering requirement (e.g. 30x)')} className="input" type="number" />
                <input placeholder={t('bonuses.maxClaims', 'Max claims')} className="input" type="number" />
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn btn-primary text-sm">{t('bonuses.createBonus', 'Create Bonus')}</button>
                <button onClick={() => setShowCreate(false)} className="btn btn-secondary text-sm">
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Bonus List */}
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {bonuses.length === 0 && !loading && (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                {t('bonuses.noBonuses', 'No bonuses found in database.')}
              </div>
            )}
            {bonuses.map(bonus => (
              <div key={bonus.id} className={`px-5 py-3 ${!bonus.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{bonus.name}</p>
                    <span className="badge badge-info text-[10px]">{TYPE_LABELS[bonus.type] || bonus.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBonus(bonus.id)}
                      className="p-1 rounded hover:bg-gray-800 transition-colors"
                    >
                      {bonus.active ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <button className="p-1 rounded hover:bg-gray-800 transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteBonus(bonus.id)}
                      className="p-1 rounded hover:bg-gray-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-amber-400 mb-1">{bonus.value}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {bonus.wageringRequirement}x {t('bonuses.wagering', 'wagering')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {bonus.claimed} {t('bonuses.activeUsers', 'active users')}
                  </span>
                  {bonus.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t('bonuses.expires', 'Expires')} {new Date(bonus.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}