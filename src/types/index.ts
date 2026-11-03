/**
 * Haider Offline Messaging System - Core Type Definitions
 * Professional peer-to-peer offline messaging architecture
 */

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'SCANNING'
  | 'DEVICE_FOUND'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'CONNECTION_FAILED';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type GroupRole = 'creator' | 'admin' | 'member';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export type AttachmentType = 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'archive' | 'file';

export interface DeviceAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string; // base64 / blob URL for local preview and download
  transferProgress?: number; // 0 to 100
  isVoiceNote?: boolean;
  durationSeconds?: number;
}

export interface DeviceMessage {
  id: string;
  conversationId: string; // recipientDeviceId for 1:1, or groupId for group
  senderId: string;
  senderName: string;
  recipientId?: string; // for private 1:1 message
  groupId?: string; // for group message
  text: string;
  timestamp: number;
  status: MessageStatus;
  encryptedPayload?: string; // Base64 AES-256-GCM ciphertext
  iv?: string; // Base64 initialization vector
  signature?: string; // HMAC integrity signature
  attachments?: DeviceAttachment[];
  replyToId?: string;
  replyToSnippet?: string;
  isPrivate: boolean;
}

export interface DiscoveredDevice {
  deviceId: string;
  name: string;
  publicKey: string; // Base64 exported raw public key
  fingerprint: string;
  rssi?: number; // Signal strength in dBm (-30 dBm to -90 dBm)
  distanceApproxMeters?: number;
  status: ConnectionStatus;
  lastSeen: number;
  isIncomingRequest?: boolean;
}

export interface GroupMember {
  deviceId: string;
  name: string;
  role: GroupRole;
  joinedAt: number;
  isOnline: boolean;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  groupPhoto?: string;
  creatorId: string;
  creatorName: string;
  invitedDeviceId: string;
  status: InvitationStatus;
  timestamp: number;
  encryptedGroupKey?: string; // Group key wrapped with recipient's public key
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  creatorId: string;
  members: GroupMember[];
  invitations: GroupInvitation[];
  createdAt: number;
  updatedAt: number;
  unreadCount: number;
  lastMessage?: DeviceMessage;
}

export interface PrivateConversation {
  id: string; // Other device's deviceId
  participantDevice: DiscoveredDevice;
  unreadCount: number;
  lastMessage?: DeviceMessage;
  updatedAt: number;
  isBlocked?: boolean;
}

export interface UserProfile {
  deviceId: string;
  name: string;
  avatarUrl?: string;
  fingerprint: string;
  publicKey: string;
  createdAt: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'cyan' | 'blue' | 'purple' | 'emerald' | 'amber';
export type ChatWallpaper = 'cosmic' | 'grid' | 'frosted' | 'aurora' | 'minimal';
export type FontSize = 'small' | 'default' | 'large';

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  wallpaper: ChatWallpaper;
  fontSize: FontSize;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoDownloadMedia: boolean;
  allowIncomingNearby: boolean;
  broadcastPresence: boolean;
}

/**
 * P2P Transport Packet Structure (Over WebRTC DataChannel, Local Broadcast, or Nearby Connections)
 */
export type PacketType =
  | 'BEACON'
  | 'CONNECT_REQUEST'
  | 'CONNECT_ACCEPT'
  | 'CONNECT_REJECT'
  | 'DISCONNECT'
  | 'PRIVATE_MSG'
  | 'DELIVERY_ACK'
  | 'READ_ACK'
  | 'GROUP_INVITE'
  | 'GROUP_INVITE_RESPONSE'
  | 'GROUP_MSG'
  | 'GROUP_MEMBER_UPDATE'
  | 'FILE_CHUNK';

export interface TransportPacket {
  packetId: string;
  type: PacketType;
  senderId: string;
  senderName: string;
  senderPublicKey: string;
  senderFingerprint: string;
  targetId?: string; // specific target device (for 1:1, or undefined for broadcast)
  timestamp: number;
  payload: any;
}
