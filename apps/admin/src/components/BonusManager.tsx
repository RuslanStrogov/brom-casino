'use client';

import React from 'react';
import { Gift, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Users, Clock, Percent } from 'lucide-react';

interface Bonus {
  id: string;
  name: string;
  type: 'welcome' | 'deposit' | 'free_spins' | 'cashback' | 'referral' | 'no_deposit';
  value: string;
  wageringRequirement: number;
  maxClaim: number;
  claimed: number;
  active: boolean;
  expiresAt?: string;
  conditions: string[];
}

const MOCK_BONUSES: Bonus[] = [
  {
    id: 'bonus-1',
    name: 'Welcome Bonus',
    type: 'welcome',
    value: '100% up to 500 TON',
    wageringRequirement: 30,
    maxClaim: 1000,
    claimed: 847,
    active: true,
    conditions: ['First deposit only', 'Min deposit 1 TON', '7 days to wager'],
  },
  {
    id: 'bonus-2',
    name: 'Daily Cashback',
    type: 'cashback',
    value: '10% up to 50 TON',
    wageringRequirement: 5,
    maxClaim: 500,
    claimed: 312,
    active: true,
    conditions: ['Daily claim', 'Net losses only', 'Min loss 5 TON'],
  },
  {
    id: 'bonus-3',
    name: 'Free Spins Friday',
    type: 'free_spins',
    value: '50 Free Spins',
    wageringRequirement: 20,
    maxClaim: 200,
    claimed: 156,
    active: true,
    expiresAt: '2026-06-21',
    conditions: ['Fridays only', 'Valid on Lucky 7s', 'Max win 100 TON'],
  },
  {
    id: 'bonus-4',
    name: 'Referral Bonus',
    type: 'referral',
    value: '5 TON per referral',
    wageringRequirement: 10,
    maxClaim: 50,
    claimed: 234,
    active: true,
    conditions: ['Referrer gets 5 TON', 'Referred gets 5 TON', 'Min deposit by friend: 5 TON'],
  },
  {
    id: 'bonus-5',
    name: 'No Deposit Bonus',
    type: 'no_deposit',
    value: '1 TON free',
    wageringRequirement: 40,
    maxClaim: 100,
    claimed: 98,
    active: false,
    conditions: ['New users only', 'Max withdrawal 10 TON', 'One per user'],
  },
];

const TYPE_LABELS: Record<Bonus['type'], string> = {
  welcome: 'Welcome',
  deposit: 'Deposit',
  free_spins: 'Free Spins',
  cashback: 'Cashback',
  referral: 'Referral',
  no_deposit: 'No Deposit',
};

export default function BonusManager() {
  const [bonuses, setBonuses] = React.useState(MOCK_BONUSES);
  const [showCreate, setShowCreate] = React.useState(false);

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
            <h2 className="text-lg font-semibold">Bonuses</h2>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="px-5 py-4 border-b border-gray-800 bg-gray-800/30">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Bonus name" className="input" />
            <select className="input">
              <option value="welcome">Welcome</option>
              <option value="deposit">Deposit</option>
              <option value="free_spins">Free Spins</option>
              <option value="cashback">Cashback</option>
              <option value="referral">Referral</option>
              <option value="no_deposit">No Deposit</option>
            </select>
            <input placeholder="Value (e.g. 100% up to 500 TON)" className="input col-span-2" />
            <input placeholder="Wagering requirement (e.g. 30x)" className="input" type="number" />
            <input placeholder="Max claims" className="input" type="number" />
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary text-sm">Create Bonus</button>
            <button onClick={() => setShowCreate(false)} className="btn btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bonus List */}
      <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
        {bonuses.map(bonus => (
          <div key={bonus.id} className={`px-5 py-3 ${!bonus.active ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{bonus.name}</p>
                <span className="badge badge-info text-[10px]">{TYPE_LABELS[bonus.type]}</span>
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
                {bonus.wageringRequirement}x wagering
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {bonus.claimed}/{bonus.maxClaim} claimed
              </span>
              {bonus.expiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires {bonus.expiresAt}
                </span>
              )}
            </div>

            {/* Claim progress */}
            <div className="mt-2">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(bonus.claimed / bonus.maxClaim) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
