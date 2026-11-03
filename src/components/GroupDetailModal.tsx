import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  UserMinus,
  LogOut,
  X,
  Crown,
  Shield,
  User,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GroupChat } from '../types';

interface GroupDetailModalProps {
  group: GroupChat;
  onClose: () => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({ group, onClose }) => {
  const {
    userProfile,
    nearbyDevices,
    addMemberToGroup,
    removeMemberFromGroup,
    leaveGroup,
  } = useApp();

  const [showAddMember, setShowAddMember] = useState(false);

  const isCreator = userProfile?.deviceId === group.creatorId;
  const myRole = group.members.find((m) => m.deviceId === userProfile?.deviceId)?.role || 'member';
  const canManage = isCreator || myRole === 'admin';

  // Nearby devices not yet in group
  const nonMemberNearby = nearbyDevices.filter(
    (dev) => !group.members.some((m) => m.deviceId === dev.deviceId)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass-elevated max-w-md w-full rounded-3xl p-6 border border-white/[0.12] space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/40 to-indigo-600/40 border border-purple-400/40 flex items-center justify-center font-display font-bold text-xl text-purple-200 shadow-inner">
              <Users className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{group.name}</h3>
              <p className="text-xs text-slate-400">
                Created {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        {group.description && (
          <p className="text-xs text-slate-300 bg-white/[0.04] p-3 rounded-xl border border-white/[0.06]">
            {group.description}
          </p>
        )}

        {/* Security verification badge */}
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-2.5 text-xs text-purple-200">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold text-white">Group Key Encapsulation Active</span>
            <p className="text-[11px] text-purple-300/80 truncate">
              Unique 256-bit AES-GCM group key held exclusively by verified members.
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Group Members ({group.members.length})
            </h4>

            {canManage && (
              <button
                onClick={() => setShowAddMember((prev) => !prev)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Add member drawer */}
          {showAddMember && (
            <div className="p-3 rounded-2xl liquid-glass border border-cyan-400/30 space-y-2">
              <p className="text-[11px] text-slate-300 font-medium">Select nearby device to invite:</p>
              {nonMemberNearby.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No other nearby devices available.</p>
              ) : (
                nonMemberNearby.map((dev) => (
                  <div
                    key={dev.deviceId}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">{dev.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">
                        {dev.fingerprint}
                      </span>
                    </div>
                    <button
                      onClick={() => addMemberToGroup(group.id, dev)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold hover:bg-cyan-500/30"
                    >
                      Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {group.members.map((member) => {
              const isMemberCreator = member.deviceId === group.creatorId;
              const isMe = member.deviceId === userProfile?.deviceId;

              return (
                <div
                  key={member.deviceId}
                  className="p-2.5 rounded-xl liquid-glass border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-purple-200">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {member.name} {isMe && '(You)'}
                        </span>
                        {isMemberCreator && (
                          <span title="Group Owner">
                            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        {member.role === 'admin' && !isMemberCreator && (
                          <span title="Group Admin">
                            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {canManage && !isMe && !isMemberCreator && (
                    <button
                      onClick={() => removeMemberFromGroup(group.id, member.deviceId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/[0.08]"
                      title="Remove Member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={() => leaveGroup(group.id)}
            className="px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isCreator ? 'Delete Group' : 'Leave Group'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl liquid-glass text-xs font-semibold text-slate-200 hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
