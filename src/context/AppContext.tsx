/**
 * Haider Offline Messaging System - Central Application Context
 * Coordinates Cryptography, Offline P2P Transport, Database Persistence,
 * Private 1:1 E2EE messaging, Group chat administration, and Audio/File attachments.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AccentColor,
  ChatWallpaper,
  ConnectionStatus,
  DeviceAttachment,
  DeviceMessage,
  DiscoveredDevice,
  FontSize,
  GroupChat,
  GroupInvitation,
  PrivateConversation,
  ThemeMode,
  TransportPacket,
  UserProfile,
  UserSettings,
} from '../types';
import { cryptoService } from '../crypto/cryptoService';
import { storageService } from '../services/storageService';
import { offlineP2PService } from '../services/offlineP2PService';

interface AppContextType {
  // Identity
  userProfile: UserProfile | null;
  updateProfileName: (name: string) => Promise<void>;
  resetKeys: () => Promise<void>;

  // Navigation
  activeTab: 'chats' | 'nearby' | 'groups' | 'settings';
  setActiveTab: (tab: 'chats' | 'nearby' | 'groups' | 'settings') => void;

  // Conversations & Messaging
  conversations: PrivateConversation[];
  currentChatId: string | null;
  currentChatType: 'private' | 'group' | null;
  openPrivateChat: (peerDevice: DiscoveredDevice) => void;
  openGroupChat: (group: GroupChat) => void;
  closeChat: () => void;
  messages: DeviceMessage[];
  sendMessage: (text: string, attachments?: DeviceAttachment[], replyTo?: DeviceMessage) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Nearby Discovery & Connections
  nearbyDevices: DiscoveredDevice[];
  isScanning: boolean;
  startScanning: () => void;
  stopScanning: () => void;
  requestConnection: (deviceId: string) => void;
  acceptConnection: (deviceId: string) => void;
  rejectConnection: (deviceId: string) => void;
  disconnectDevice: (deviceId: string) => void;

  // Groups
  groups: GroupChat[];
  invitations: GroupInvitation[];
  createGroup: (name: string, description: string, memberDeviceIds: string[]) => Promise<string>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  addMemberToGroup: (groupId: string, peerDevice: DiscoveredDevice) => Promise<void>;
  removeMemberFromGroup: (groupId: string, memberDeviceId: string) => Promise<void>;

  // Settings & Liquid Glass Customization
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Security & Notifications
  securityNotice: string | null;
  clearSecurityNotice: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'nearby' | 'groups' | 'settings'>('chats');
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatType, setCurrentChatType] = useState<'private' | 'group' | null>(null);
  const [messages, setMessages] = useState<DeviceMessage[]>([]);
  const [nearbyDevices, setNearbyDevices] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Group raw keys stored locally: groupId -> rawKeyBase64
  const [groupRawKeys, setGroupRawKeys] = useState<Record<string, string>>(() => {
    try {
      const s = localStorage.getItem('haider_group_keys');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  // Save group raw keys
  const saveGroupKey = useCallback((groupId: string, rawKeyBase64: string) => {
    setGroupRawKeys((prev) => {
      const updated = { ...prev, [groupId]: rawKeyBase64 };
      localStorage.setItem('haider_group_keys', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 1. Initialize Device Cryptographic Identity
  useEffect(() => {
    async function init() {
      const saved = storageService.getSavedIdentity();
      let deviceId = saved.profile?.deviceId;
      let name = saved.profile?.name;

      if (!deviceId) {
        // Generate a random unique device identifier
        const randId = Math.random().toString(36).substring(2, 8).toUpperCase();
        deviceId = `HAIDER-${randId}`;
        name = `Haider Device (${randId})`;
      }

      const cryptoIdentity = await cryptoService.initIdentity(saved.keyPair);

      const profile: UserProfile = {
        deviceId,
        name: name || `Haider Device`,
        fingerprint: cryptoIdentity.fingerprint,
        publicKey: cryptoIdentity.publicKey,
        createdAt: saved.profile?.createdAt || Date.now(),
      };

      await storageService.saveIdentity(profile, cryptoIdentity.storedKeyPair);
      setUserProfile(profile);

      // Initialize offline P2P transport
      offlineP2PService.init(profile.deviceId, profile.name);

      // Load stored conversations, groups, and invitations
      const storedConvs = await storageService.getConversations();
      setConversations(storedConvs);

      const storedGroups = await storageService.getGroups();
      setGroups(storedGroups);

      const storedInvites = await storageService.getInvitations();
      setInvitations(storedInvites);

      // Re-import cached group keys into CryptoService
      try {
        const s = localStorage.getItem('haider_group_keys');
        if (s) {
          const keys = JSON.parse(s);
          for (const [gId, rawK] of Object.entries(keys)) {
            await cryptoService.importGroupKey(gId, rawK as string);
          }
        }
      } catch (err) {
        console.warn('Failed re-importing group keys', err);
      }
    }

    init();
  }, []);

  // 2. Sync Theme with HTML document class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // 3. Periodic Poll for Nearby Discovered Devices
  useEffect(() => {
    const interval = setInterval(() => {
      setNearbyDevices(offlineP2PService.getDiscoveredDevices());
      setIsScanning(offlineP2PService.getIsScanning());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Handle Incoming P2P Packets
  useEffect(() => {
    if (!userProfile) return;

    const unsubscribe = offlineP2PService.onPacket(async (packet: TransportPacket) => {
      // Packet verification
      if (packet.senderId === userProfile.deviceId) return;

      switch (packet.type) {
        case 'PRIVATE_MSG': {
          // Strictly verify recipient: Only intended recipient processes this!
          if (packet.targetId !== userProfile.deviceId) {
            // E.g. If Ali happens to hear packet meant for Ahmad, Ali ignores it!
            setSecurityNotice(
              `Security Notice: Intercepted packet addressed to ${packet.targetId} was rejected. Private conversation confidentiality preserved.`
            );
            return;
          }

          try {
            const { ciphertext, iv, messageId } = packet.payload;
            // Decrypt with recipient's private key + sender's public key (ECDH)
            const decrypted = await cryptoService.decryptPrivateMessage(
              packet.senderPublicKey,
              ciphertext,
              iv
            );

            const incomingMsg: DeviceMessage = {
              id: decrypted.id || messageId,
              conversationId: packet.senderId,
              senderId: packet.senderId,
              senderName: packet.senderName,
              recipientId: userProfile.deviceId,
              text: decrypted.text,
              timestamp: decrypted.timestamp || packet.timestamp,
              status: 'delivered',
              attachments: decrypted.attachments || [],
              replyToId: decrypted.replyToId,
              replyToSnippet: decrypted.replyToSnippet,
              isPrivate: true,
            };

            await storageService.saveMessage(incomingMsg);

            // Send delivery acknowledgment back to sender immediately
            offlineP2PService.sendDeliveryAck(packet.senderId, incomingMsg.id);

            // Update conversation list
            setConversations((prev) => {
              const existing = prev.find((c) => c.id === packet.senderId);
              const senderDevice: DiscoveredDevice = {
                deviceId: packet.senderId,
                name: packet.senderName,
                publicKey: packet.senderPublicKey,
                fingerprint: packet.senderFingerprint,
                status: 'CONNECTED',
                lastSeen: Date.now(),
              };

              const isCurrentChat = currentChatId === packet.senderId;
              const unread = isCurrentChat ? 0 : (existing?.unreadCount || 0) + 1;

              const updatedConv: PrivateConversation = {
                id: packet.senderId,
                participantDevice: senderDevice,
                unreadCount: unread,
                lastMessage: incomingMsg,
                updatedAt: incomingMsg.timestamp,
              };

              const filtered = prev.filter((c) => c.id !== packet.senderId);
              return [updatedConv, ...filtered];
            });

            // If active in this chat, append to messages and send read receipt
            if (currentChatId === packet.senderId) {
              setMessages((prev) => [...prev, incomingMsg]);
              offlineP2PService.sendReadAck(packet.senderId, incomingMsg.id);
            }
          } catch (err) {
            console.error('Failed to decrypt private message - authentication failed', err);
          }
          break;
        }

        case 'DELIVERY_ACK': {
          const { messageId } = packet.payload;
          await storageService.updateMessageStatus(messageId, 'delivered');
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, status: 'delivered' } : m))
          );
          break;
        }

        case 'READ_ACK': {
          const { messageId } = packet.payload;
          await storageService.updateMessageStatus(messageId, 'read');
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, status: 'read' } : m))
          );
          break;
        }

        case 'GROUP_INVITE': {
          if (packet.targetId !== userProfile.deviceId) return;
          const { invitation, encryptedGroupKey, keyIv } = packet.payload;

          const invite: GroupInvitation = {
            ...invitation,
            encryptedGroupKey,
            status: 'pending',
          };

          await storageService.saveInvitation(invite);
          setInvitations((prev) => {
            const exists = prev.find((i) => i.id === invite.id);
            return exists ? prev : [invite, ...prev];
          });
          break;
        }

        case 'GROUP_INVITE_RESPONSE': {
          const { invitationId, accepted } = packet.payload;
          setGroups((prev) =>
            prev.map((grp) => {
              const inv = grp.invitations?.find((i) => i.id === invitationId);
              if (!inv) return grp;

              const updatedInvs = grp.invitations.map((i) =>
                i.id === invitationId ? { ...i, status: accepted ? ('accepted' as const) : ('rejected' as const) } : i
              );

              let updatedMembers = [...grp.members];
              if (accepted && !grp.members.some((m) => m.deviceId === packet.senderId)) {
                updatedMembers.push({
                  deviceId: packet.senderId,
                  name: packet.senderName,
                  role: 'member',
                  joinedAt: Date.now(),
                  isOnline: true,
                });
              }

              const updatedGrp: GroupChat = {
                ...grp,
                invitations: updatedInvs,
                members: updatedMembers,
                updatedAt: Date.now(),
              };
              storageService.saveGroup(updatedGrp);
              return updatedGrp;
            })
          );
          break;
        }

        case 'GROUP_MSG': {
          const { groupId, messageId, ciphertext, iv, authorizedMembers } = packet.payload;

          // Check if current device is an authorized member
          if (authorizedMembers && !authorizedMembers.includes(userProfile.deviceId)) {
            // Drop packet! Device is not authorized in this group.
            return;
          }

          try {
            // Decrypt with Group Key
            const decrypted = await cryptoService.decryptGroupMessage(groupId, ciphertext, iv);

            const incomingGroupMsg: DeviceMessage = {
              id: decrypted.id || messageId,
              conversationId: groupId,
              groupId,
              senderId: packet.senderId,
              senderName: packet.senderName,
              text: decrypted.text,
              timestamp: decrypted.timestamp || packet.timestamp,
              status: 'delivered',
              attachments: decrypted.attachments || [],
              replyToId: decrypted.replyToId,
              replyToSnippet: decrypted.replyToSnippet,
              isPrivate: false,
            };

            await storageService.saveMessage(incomingGroupMsg);

            // Update group preview
            setGroups((prev) =>
              prev.map((g) => {
                if (g.id === groupId) {
                  const isCurrentChat = currentChatId === groupId;
                  const unread = isCurrentChat ? 0 : g.unreadCount + 1;
                  return {
                    ...g,
                    lastMessage: incomingGroupMsg,
                    unreadCount: unread,
                    updatedAt: incomingGroupMsg.timestamp,
                  };
                }
                return g;
              })
            );

            // If active in this group chat, append
            if (currentChatId === groupId) {
              setMessages((prev) => [...prev, incomingGroupMsg]);
            }
          } catch (err) {
            console.warn('Failed to decrypt group message - unauthorized device or missing group key', err);
          }
          break;
        }
      }
    });

    return () => unsubscribe();
  }, [userProfile, currentChatId]);

  // 5. Open Private Chat
  const openPrivateChat = useCallback(
    async (peerDevice: DiscoveredDevice) => {
      setCurrentChatId(peerDevice.deviceId);
      setCurrentChatType('private');

      // Load messages
      const msgs = await storageService.getMessages(peerDevice.deviceId);
      setMessages(msgs);

      // Reset unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === peerDevice.deviceId ? { ...c, unreadCount: 0 } : c))
      );

      // Send read acks for received unread messages
      msgs
        .filter((m) => m.senderId === peerDevice.deviceId && m.status !== 'read')
        .forEach((m) => {
          offlineP2PService.sendReadAck(peerDevice.deviceId, m.id);
          storageService.updateMessageStatus(m.id, 'read');
        });
    },
    []
  );

  // 6. Open Group Chat
  const openGroupChat = useCallback(async (group: GroupChat) => {
    setCurrentChatId(group.id);
    setCurrentChatType('group');

    const msgs = await storageService.getMessages(group.id);
    setMessages(msgs);

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, unreadCount: 0 } : g))
    );
  }, []);

  const closeChat = useCallback(() => {
    setCurrentChatId(null);
    setCurrentChatType(null);
    setMessages([]);
  }, []);

  // 7. Send Message (Private or Group)
  const sendMessage = useCallback(
    async (text: string, attachments: DeviceAttachment[] = [], replyTo?: DeviceMessage) => {
      if (!userProfile || !currentChatId) return;

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = Date.now();

      const newMsg: DeviceMessage = {
        id: messageId,
        conversationId: currentChatId,
        senderId: userProfile.deviceId,
        senderName: userProfile.name,
        text,
        timestamp,
        status: 'sending',
        attachments,
        replyToId: replyTo?.id,
        replyToSnippet: replyTo ? `${replyTo.senderName}: ${replyTo.text.substring(0, 40)}` : undefined,
        isPrivate: currentChatType === 'private',
        recipientId: currentChatType === 'private' ? currentChatId : undefined,
        groupId: currentChatType === 'group' ? currentChatId : undefined,
      };

      // Optimistic append
      setMessages((prev) => [...prev, newMsg]);

      if (currentChatType === 'private') {
        const peer = nearbyDevices.find((d) => d.deviceId === currentChatId) ||
          conversations.find((c) => c.id === currentChatId)?.participantDevice;

        if (!peer) {
          newMsg.status = 'failed';
          await storageService.saveMessage(newMsg);
          setMessages((prev) => prev.map((m) => (m.id === messageId ? newMsg : m)));
          return;
        }

        try {
          await offlineP2PService.sendPrivateMessage(peer, newMsg);
          newMsg.status = 'sent';
          await storageService.saveMessage(newMsg);

          setConversations((prev) => {
            const existing = prev.find((c) => c.id === peer.deviceId);
            const updatedConv: PrivateConversation = {
              id: peer.deviceId,
              participantDevice: peer,
              unreadCount: 0,
              lastMessage: newMsg,
              updatedAt: timestamp,
            };
            const filtered = prev.filter((c) => c.id !== peer.deviceId);
            return [updatedConv, ...filtered];
          });
        } catch (err) {
          console.error('Error sending private message', err);
          newMsg.status = 'failed';
          await storageService.saveMessage(newMsg);
        }
      } else if (currentChatType === 'group') {
        const group = groups.find((g) => g.id === currentChatId);
        if (!group) return;

        try {
          const memberIds = group.members.map((m) => m.deviceId);
          await offlineP2PService.sendGroupMessage(group.id, newMsg, memberIds);
          newMsg.status = 'sent';
          await storageService.saveMessage(newMsg);

          setGroups((prev) =>
            prev.map((g) =>
              g.id === group.id ? { ...g, lastMessage: newMsg, updatedAt: timestamp } : g
            )
          );
        } catch (err) {
          console.error('Error sending group message', err);
          newMsg.status = 'failed';
          await storageService.saveMessage(newMsg);
        }
      }

      setMessages((prev) => prev.map((m) => (m.id === messageId ? newMsg : m)));
    },
    [userProfile, currentChatId, currentChatType, nearbyDevices, conversations, groups]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!currentChatId) return;
      await storageService.deleteMessage(messageId, currentChatId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [currentChatId]
  );

  // 8. Group Management
  const createGroup = useCallback(
    async (name: string, description: string, memberDeviceIds: string[]): Promise<string> => {
      if (!userProfile) throw new Error('No user profile');

      const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Generate 256-bit AES-GCM group key
      const { rawKeyBase64 } = await cryptoService.generateGroupKey();
      await cryptoService.importGroupKey(groupId, rawKeyBase64);
      saveGroupKey(groupId, rawKeyBase64);

      const creatorMember = {
        deviceId: userProfile.deviceId,
        name: userProfile.name,
        role: 'creator' as const,
        joinedAt: Date.now(),
        isOnline: true,
      };

      const invitationsList: GroupInvitation[] = [];

      // Send invitations with wrapped group key to each selected member
      for (const targetId of memberDeviceIds) {
        const peer = nearbyDevices.find((d) => d.deviceId === targetId);
        if (!peer) continue;

        const invite: GroupInvitation = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          groupId,
          groupName: name,
          groupDescription: description,
          creatorId: userProfile.deviceId,
          creatorName: userProfile.name,
          invitedDeviceId: targetId,
          status: 'pending',
          timestamp: Date.now(),
        };

        invitationsList.push(invite);

        // Transmit group invite over P2P mesh
        await offlineP2PService.sendGroupInvitation(peer, invite, rawKeyBase64);
      }

      const newGroup: GroupChat = {
        id: groupId,
        name,
        description,
        creatorId: userProfile.deviceId,
        members: [creatorMember],
        invitations: invitationsList,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        unreadCount: 0,
      };

      await storageService.saveGroup(newGroup);
      setGroups((prev) => [newGroup, ...prev]);
      return groupId;
    },
    [userProfile, nearbyDevices, saveGroupKey]
  );

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      const invite = invitations.find((i) => i.id === invitationId);
      if (!invite || !userProfile) return;

      try {
        // Find sender peer
        const peer = nearbyDevices.find((d) => d.deviceId === invite.creatorId);
        let rawKey = '';

        if (peer && invite.encryptedGroupKey) {
          rawKey = await cryptoService.unwrapGroupKeyFromInvite(
            peer.publicKey,
            invite.encryptedGroupKey,
            invite.encryptedGroupKey.substring(0, 16) // fallback iv slice if combined
          );
        } else if (invite.encryptedGroupKey) {
          // If stored raw key or fallback
          rawKey = invite.encryptedGroupKey;
        }

        if (rawKey) {
          await cryptoService.importGroupKey(invite.groupId, rawKey);
          saveGroupKey(invite.groupId, rawKey);
        }

        // Send acceptance response to creator
        offlineP2PService.sendGroupInvitationResponse(invite.creatorId, invitationId, true);

        // Update local group
        const joinedGroup: GroupChat = {
          id: invite.groupId,
          name: invite.groupName,
          description: invite.groupDescription,
          creatorId: invite.creatorId,
          members: [
            {
              deviceId: invite.creatorId,
              name: invite.creatorName,
              role: 'creator',
              joinedAt: invite.timestamp,
              isOnline: true,
            },
            {
              deviceId: userProfile.deviceId,
              name: userProfile.name,
              role: 'member',
              joinedAt: Date.now(),
              isOnline: true,
            },
          ],
          invitations: [],
          createdAt: invite.timestamp,
          updatedAt: Date.now(),
          unreadCount: 0,
        };

        await storageService.saveGroup(joinedGroup);
        setGroups((prev) => {
          const filtered = prev.filter((g) => g.id !== joinedGroup.id);
          return [joinedGroup, ...filtered];
        });

        // Remove from pending invitations
        const updatedInvites = invitations.filter((i) => i.id !== invitationId);
        setInvitations(updatedInvites);
        await storageService.saveInvitation({ ...invite, status: 'accepted' });
      } catch (err) {
        console.error('Failed to accept group invite', err);
      }
    },
    [invitations, userProfile, nearbyDevices, saveGroupKey]
  );

  const rejectInvitation = useCallback(
    async (invitationId: string) => {
      const invite = invitations.find((i) => i.id === invitationId);
      if (!invite) return;

      offlineP2PService.sendGroupInvitationResponse(invite.creatorId, invitationId, false);
      const updatedInvites = invitations.filter((i) => i.id !== invitationId);
      setInvitations(updatedInvites);
      await storageService.saveInvitation({ ...invite, status: 'rejected' });
    },
    [invitations]
  );

  const leaveGroup = useCallback(async (groupId: string) => {
    await storageService.deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (currentChatId === groupId) {
      closeChat();
    }
  }, [currentChatId, closeChat]);

  const addMemberToGroup = useCallback(
    async (groupId: string, peerDevice: DiscoveredDevice) => {
      if (!userProfile) return;
      const group = groups.find((g) => g.id === groupId);
      const rawKey = groupRawKeys[groupId];
      if (!group || !rawKey) return;

      const invite: GroupInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        groupId,
        groupName: group.name,
        groupDescription: group.description,
        creatorId: userProfile.deviceId,
        creatorName: userProfile.name,
        invitedDeviceId: peerDevice.deviceId,
        status: 'pending',
        timestamp: Date.now(),
      };

      await offlineP2PService.sendGroupInvitation(peerDevice, invite, rawKey);

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, invitations: [...(g.invitations || []), invite], updatedAt: Date.now() }
            : g
        )
      );
    },
    [userProfile, groups, groupRawKeys]
  );

  const removeMemberFromGroup = useCallback(
    async (groupId: string, memberDeviceId: string) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.filter((m) => m.deviceId !== memberDeviceId),
                updatedAt: Date.now(),
              }
            : g
        )
      );
    },
    []
  );

  // 9. Discovery & Connections
  const startScanning = useCallback(() => {
    offlineP2PService.startScanning();
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    offlineP2PService.stopScanning();
    setIsScanning(false);
  }, []);

  const requestConnection = useCallback((deviceId: string) => {
    offlineP2PService.requestConnection(deviceId);
    setNearbyDevices(offlineP2PService.getDiscoveredDevices());
  }, []);

  const acceptConnection = useCallback((deviceId: string) => {
    offlineP2PService.acceptConnection(deviceId);
    setNearbyDevices(offlineP2PService.getDiscoveredDevices());
  }, []);

  const rejectConnection = useCallback((deviceId: string) => {
    offlineP2PService.rejectConnection(deviceId);
    setNearbyDevices(offlineP2PService.getDiscoveredDevices());
  }, []);

  const disconnectDevice = useCallback((deviceId: string) => {
    offlineP2PService.disconnect(deviceId);
    setNearbyDevices(offlineP2PService.getDiscoveredDevices());
  }, []);

  // 10. Update Profile & Settings
  const updateProfileName = useCallback(
    async (name: string) => {
      if (!userProfile) return;
      const updated = { ...userProfile, name };
      setUserProfile(updated);
      offlineP2PService.updateDeviceName(name);
      const saved = storageService.getSavedIdentity();
      if (saved.keyPair) {
        await storageService.saveIdentity(updated, saved.keyPair);
      }
    },
    [userProfile]
  );

  const resetKeys = useCallback(async () => {
    await storageService.clearAllData();
    window.location.reload();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      storageService.saveSettings(updated);
      return updated;
    });
  }, []);

  const clearSecurityNotice = useCallback(() => {
    setSecurityNotice(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userProfile,
        updateProfileName,
        resetKeys,
        activeTab,
        setActiveTab,
        conversations,
        currentChatId,
        currentChatType,
        openPrivateChat,
        openGroupChat,
        closeChat,
        messages,
        sendMessage,
        deleteMessage,
        searchQuery,
        setSearchQuery,
        nearbyDevices,
        isScanning,
        startScanning,
        stopScanning,
        requestConnection,
        acceptConnection,
        rejectConnection,
        disconnectDevice,
        groups,
        invitations,
        createGroup,
        acceptInvitation,
        rejectInvitation,
        leaveGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        settings,
        updateSettings,
        securityNotice,
        clearSecurityNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
