import React from 'react';
import { MessageSquare, Radio, Users, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NavigationBar: React.FC = () => {
  const { activeTab, setActiveTab, conversations, groups, invitations, isScanning, nearbyDevices } = useApp();

  const totalUnreadChats =
    conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) +
    groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0);

  const pendingInvitesCount = invitations.filter((i) => i.status === 'pending').length;
  const connectedNearbyCount = nearbyDevices.filter((d) => d.status === 'CONNECTED').length;

  const navItems = [
    {
      id: 'chats' as const,
      label: 'Chats',
      icon: MessageSquare,
      badge: totalUnreadChats > 0 ? totalUnreadChats : null,
    },
    {
      id: 'nearby' as const,
      label: 'Nearby',
      icon: Radio,
      badge: connectedNearbyCount > 0 ? connectedNearbyCount : null,
      isPulse: isScanning,
    },
    {
      id: 'groups' as const,
      label: 'Groups',
      icon: Users,
      badge: pendingInvitesCount > 0 ? pendingInvitesCount : null,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-1 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="liquid-glass-elevated rounded-2xl px-2 py-1.5 flex items-center justify-around border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-400 font-semibold bg-white/[0.08]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                    }`}
                  />

                  {/* Pulsing beacon indicator for active scanning */}
                  {item.isPulse && !item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}

                  {/* Numeric Badge */}
                  {item.badge !== null && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(0,210,255,0.4)]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] tracking-tight mt-1 truncate">
                  {item.label}
                </span>

                {/* Subtle active pill glow */}
                {isActive && (
                  <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,210,255,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
