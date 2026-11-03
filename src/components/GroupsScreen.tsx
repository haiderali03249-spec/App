import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GroupChat } from '../types';
import { CreateGroupModal } from './CreateGroupModal';

interface GroupsScreenProps {
  onOpenGroupChat: (group: GroupChat) => void;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({ onOpenGroupChat }) => {
  const {
    groups,
    invitations,
    acceptInvitation,
    rejectInvitation,
    searchQuery,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col min-h-screen pb-28 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 px-5 pt-6 pb-4 liquid-glass-elevated border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              Group Mesh
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                E2EE Groups
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Zero-server, authenticated offline group communication
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-xl liquid-glass-button text-xs font-bold text-white flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {/* Pending Group Invitations Banner */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pending Group Invitations ({pendingInvitations.length})</span>
            </h2>

            {pendingInvitations.map((invite) => (
              <div
                key={invite.id}
                className="liquid-glass-elevated rounded-2xl p-4 border border-cyan-400/40 space-y-3 shadow-[0_4px_20px_rgba(0,210,255,0.15)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center font-bold text-purple-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{invite.groupName}</h3>
                      <p className="text-xs text-slate-300">
                        Invited by <span className="font-semibold text-cyan-300">{invite.creatorName}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    Encrypted Key Ready
                  </span>
                </div>

                {invite.groupDescription && (
                  <p className="text-xs text-slate-400 italic bg-white/[0.03] p-2 rounded-lg">
                    &quot;{invite.groupDescription}&quot;
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
                  <button
                    onClick={() => rejectInvitation(invite.id)}
                    className="px-3 py-1.5 rounded-xl liquid-glass text-xs text-red-300 hover:text-white hover:bg-red-500/20 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => acceptInvitation(invite.id)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md hover:opacity-90"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Accept &amp; Decrypt Key</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Your Groups</h2>
            <span className="text-xs text-slate-400 tabular-nums">{groups.length} active</span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-8 text-center space-y-3 border border-white/[0.06]">
              <Users className="w-8 h-8 text-purple-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">No groups joined yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Create an encrypted group and invite nearby devices, or accept an invitation.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 rounded-xl liquid-glass-button text-xs font-bold text-white inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Your First Group</span>
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => onOpenGroupChat(group)}
                className="liquid-glass-card rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-400/30 flex items-center justify-center font-display font-bold text-lg text-purple-200 shrink-0 shadow-inner">
                    <Users className="w-6 h-6 text-purple-300" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">{group.name}</span>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-400/20">
                        {group.members.length} members
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 truncate">
                      {group.lastMessage ? (
                        <>
                          <span className="text-slate-300 font-medium">
                            {group.lastMessage.senderName}:{' '}
                          </span>
                          <span>{group.lastMessage.text}</span>
                        </>
                      ) : (
                        group.description || 'Encrypted group active'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {group.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center">
                      {group.unreadCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={(gId) => {
          const g = groups.find((item) => item.id === gId);
          if (g) onOpenGroupChat(g);
        }}
      />
    </div>
  );
};
