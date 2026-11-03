import React, { useState } from 'react';
import {
  Search,
  MessageSquarePlus,
  Users,
  Radio,
  ShieldCheck,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DiscoveredDevice, GroupChat, PrivateConversation } from '../types';

interface HomeScreenProps {
  onOpenCreateGroup: () => void;
  onOpenNewChat: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenCreateGroup, onOpenNewChat }) => {
  const {
    conversations,
    groups,
    openPrivateChat,
    openGroupChat,
    searchQuery,
    setSearchQuery,
    nearbyDevices,
    isScanning,
    startScanning,
    stopScanning,
    setActiveTab,
    securityNotice,
    clearSecurityNotice,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'groups'>('all');

  const connectedDevices = nearbyDevices.filter((d) => d.status === 'CONNECTED');

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = c.participantDevice.name.toLowerCase().includes(q);
    const matchMsg = c.lastMessage?.text?.toLowerCase().includes(q);
    return matchName || matchMsg;
  });

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = g.name.toLowerCase().includes(q);
    const matchDesc = g.description?.toLowerCase().includes(q);
    const matchMsg = g.lastMessage?.text?.toLowerCase().includes(q);
    return matchName || matchDesc || matchMsg;
  });

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderStatusCheck = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-slate-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-slate-400" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 text-slate-100">
      {/* Liquid Glass Header */}
      <header className="sticky top-0 z-30 px-5 pt-6 pb-4 liquid-glass-elevated border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-400/40 via-blue-500/20 to-purple-500/30 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img
                    src="/src/assets/images/haider_logo_icon_1793634076635.jpg"
                    alt="Haider"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="font-display font-bold text-lg text-cyan-400">H</span>
                </div>
              </div>

              <div>
                <h1 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-1.5">
                  Haider
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    P2P Offline
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Connect Nearby. Message Freely.</p>
              </div>
            </div>

            {/* Quick Radar Trigger */}
            <button
              onClick={startScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isScanning
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                  : 'liquid-glass text-slate-300 hover:text-white hover:border-white/20'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isScanning ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan Nearby'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, contacts, or messages..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl liquid-glass-input text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Chats
            </button>
            <button
              onClick={() => setActiveFilter('direct')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'direct'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Private ({conversations.length})
            </button>
            <button
              onClick={() => setActiveFilter('groups')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'groups'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Groups ({groups.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* Security Notification Banner if eavesdropping was thwarted */}
        {securityNotice && (
          <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{securityNotice}</span>
            </div>
            <button
              onClick={clearSecurityNotice}
              className="text-cyan-400 hover:text-white font-bold text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Nearby Mesh Status Strip */}
        <div className="liquid-glass rounded-2xl p-3 flex items-center justify-between text-xs text-slate-300 border border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              {isScanning && (
                <span className="absolute w-4 h-4 rounded-full bg-cyan-400/40 animate-ping" />
              )}
            </div>
            <div>
              <span className="font-semibold text-white">
                {connectedDevices.length > 0
                  ? `Connected to ${connectedDevices.length} device(s)`
                  : isScanning
                  ? 'Discovering nearby Haider devices...'
                  : `${nearbyDevices.length} device(s) nearby in mesh`}
              </span>
              <p className="text-[11px] text-slate-400">Zero data • Direct peer-to-peer</p>
            </div>
          </div>

          {/* Secure Protocol Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>P2P Direct</span>
          </div>
        </div>

        {/* Prominent Start Searching Card on Dashboard */}
        <div className="liquid-glass-elevated rounded-3xl p-4 sm:p-5 border border-cyan-400/30 shadow-[0_8px_32px_rgba(0,210,255,0.18)] space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  isScanning
                    ? 'bg-cyan-500/25 border border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.4)] text-cyan-300'
                    : 'bg-white/[0.06] border border-white/[0.12] text-slate-300'
                }`}
              >
                <Radio className={`w-6 h-6 ${isScanning ? 'animate-pulse text-cyan-400' : ''}`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {isScanning ? 'Searching for Nearby Devices...' : 'Search for Nearby Devices'}
                  </h2>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isScanning
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse'
                        : 'bg-white/[0.06] text-slate-400'
                    }`}
                  >
                    {isScanning ? 'SCANNING' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isScanning
                    ? `${nearbyDevices.length} device(s) found in discovery range (Bluetooth & Wi-Fi Direct)`
                    : 'Scan nearby devices directly without internet, mobile data, or SIM card'}
                </p>
              </div>
            </div>

            {/* Dashboard Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={isScanning ? stopScanning : startScanning}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
                  isScanning
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                    : 'liquid-glass-button text-white'
                }`}
              >
                <Radio className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Stop Searching' : 'Start Searching'}</span>
              </button>

              <button
                onClick={() => setActiveTab('nearby')}
                className="px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-400/30 transition-colors flex items-center gap-1.5"
                title="View animated radar"
              >
                <span>Radar</span>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <div className="space-y-2">
          {activeFilter !== 'groups' &&
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => openPrivateChat(conv.participantDevice)}
                className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center font-display font-bold text-lg text-cyan-200 shadow-inner">
                      {conv.participantDevice.name.charAt(0).toUpperCase()}
                    </div>
                    {conv.participantDevice.status === 'CONNECTED' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#060B18]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {conv.participantDevice.name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                        {formatTimestamp(conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                        {conv.lastMessage?.senderId !== conv.participantDevice.deviceId &&
                          renderStatusCheck(conv.lastMessage?.status)}
                        <span className="truncate">
                          {conv.lastMessage?.text ||
                            (conv.lastMessage?.attachments?.length
                              ? `📎 Attachment (${conv.lastMessage.attachments[0].name})`
                              : 'Encrypted channel active')}
                        </span>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </div>
            ))}

          {activeFilter !== 'direct' &&
            filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => openGroupChat(group)}
                className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-400/30 flex items-center justify-center font-display font-bold text-lg text-purple-200 shadow-inner">
                      <Users className="w-6 h-6 text-purple-300" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm text-white truncate">
                          {group.name}
                        </span>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-400/20">
                          {group.members.length} members
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                        {formatTimestamp(group.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 truncate">
                        {group.lastMessage ? (
                          <>
                            <span className="text-slate-300 font-medium">
                              {group.lastMessage.senderName}:{' '}
                            </span>
                            <span>{group.lastMessage.text}</span>
                          </>
                        ) : (
                          group.description || 'Group created'
                        )}
                      </p>

                      {group.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {group.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </div>
            ))}

          {/* Empty state */}
          {filteredConversations.length === 0 && filteredGroups.length === 0 && (
            <div className="liquid-glass rounded-3xl p-8 text-center space-y-4 border border-white/[0.08] my-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mx-auto flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(0,210,255,0.15)]">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">No active conversations yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Scan nearby to discover devices running Haider, or start a new private/group chat.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={onOpenNewChat}
                  className="px-4 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Start Private Chat</span>
                </button>
                <button
                  onClick={onOpenCreateGroup}
                  className="px-4 py-2 rounded-xl liquid-glass text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Create Group</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end gap-2.5">
        <button
          onClick={onOpenCreateGroup}
          title="Create Group"
          className="w-12 h-12 rounded-2xl liquid-glass-elevated border border-purple-400/40 text-purple-300 hover:text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <Users className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenNewChat}
          title="New Private Chat"
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-[0_6px_25px_rgba(0,210,255,0.4)] border border-cyan-300/40 transition-transform active:scale-95"
        >
          <MessageSquarePlus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
