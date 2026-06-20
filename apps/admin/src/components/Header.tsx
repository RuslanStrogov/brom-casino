'use client';

import React from 'react';
import { Bell, Search, User, Moon, Sun, ChevronDown } from 'lucide-react';

export default function Header() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = [
    { id: 1, type: 'withdrawal', message: 'Large withdrawal request: 500 TON', time: '2 min ago', unread: true },
    { id: 2, type: 'kyc', message: 'New KYC verification pending', time: '15 min ago', unread: true },
    { id: 3, type: 'user', message: '10 new users registered today', time: '1 hour ago', unread: false },
    { id: 4, type: 'system', message: 'System backup completed', time: '3 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users, transactions, games..."
            className="w-full bg-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none text-gray-200 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button className="text-xs text-amber-400 hover:text-amber-300">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                      notif.unread ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notif.type === 'withdrawal'
                            ? 'bg-yellow-400'
                            : notif.type === 'kyc'
                            ? 'bg-blue-400'
                            : notif.type === 'user'
                            ? 'bg-green-400'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-800">
                <button className="text-xs text-amber-400 hover:text-amber-300 w-full text-center">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-800" />

        {/* Admin Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
}
