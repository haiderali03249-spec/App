/**
 * Haider Offline Messaging System - Local Storage & Database Engine
 * Persistent offline storage using IndexedDB with LocalStorage fallback.
 * Stores local encrypted chat history, group memberships, device identities, and settings.
 */

import {
  DeviceMessage,
  DiscoveredDevice,
  GroupChat,
  GroupInvitation,
  PrivateConversation,
  UserProfile,
  UserSettings,
} from '../types';
import { StoredKeyPair } from '../crypto/cryptoService';

const DB_NAME = 'HaiderOfflineDB_v1';
const DB_VERSION = 1;

class StorageService {
  private db: IDBDatabase | null = null;
  private isReady: Promise<boolean>;

  constructor() {
    this.isReady = this.initDB();
  }

  private initDB(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Stores
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('conversationId', 'conversationId', { unique: false });
          msgStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('invitations')) {
          db.createObjectStore('invitations', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('devices')) {
          db.createObjectStore('devices', { keyPath: 'deviceId' });
        }

        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to LocalStorage');
        resolve(false);
      };
    });
  }

  // --- Profile & Crypto Key Storage ---

  async saveIdentity(profile: UserProfile, keyPair: StoredKeyPair): Promise<void> {
    localStorage.setItem('haider_user_profile', JSON.stringify(profile));
    localStorage.setItem('haider_key_pair', JSON.stringify(keyPair));
  }

  getSavedIdentity(): { profile: UserProfile | null; keyPair: StoredKeyPair | null } {
    try {
      const p = localStorage.getItem('haider_user_profile');
      const k = localStorage.getItem('haider_key_pair');
      return {
        profile: p ? JSON.parse(p) : null,
        keyPair: k ? JSON.parse(k) : null,
      };
    } catch {
      return { profile: null, keyPair: null };
    }
  }

  // --- Settings ---

  getSettings(): UserSettings {
    const defaultSettings: UserSettings = {
      theme: 'dark',
      accentColor: 'cyan',
      wallpaper: 'cosmic',
      fontSize: 'default',
      soundEnabled: true,
      vibrationEnabled: true,
      autoDownloadMedia: true,
      allowIncomingNearby: true,
      broadcastPresence: true,
    };

    try {
      const stored = localStorage.getItem('haider_settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  saveSettings(settings: UserSettings): void {
    localStorage.setItem('haider_settings', JSON.stringify(settings));
  }

  // --- Messages ---

  async saveMessage(msg: DeviceMessage): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        const req = store.put(msg);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } else {
      // LocalStorage fallback
      const key = `haider_msgs_${msg.conversationId}`;
      const existing = this.getMessagesFromLocalStorage(msg.conversationId);
      const filtered = existing.filter((m) => m.id !== msg.id);
      filtered.push(msg);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  }

  async getMessages(conversationId: string): Promise<DeviceMessage[]> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');
        const index = store.index('conversationId');
        const req = index.getAll(IDBKeyRange.only(conversationId));
        req.onsuccess = () => {
          const list = (req.result as DeviceMessage[]) || [];
          list.sort((a, b) => a.timestamp - b.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve(this.getMessagesFromLocalStorage(conversationId));
      });
    }
    return this.getMessagesFromLocalStorage(conversationId);
  }

  private getMessagesFromLocalStorage(conversationId: string): DeviceMessage[] {
    try {
      const key = `haider_msgs_${conversationId}`;
      const data = localStorage.getItem(key);
      const list: DeviceMessage[] = data ? JSON.parse(data) : [];
      return list.sort((a, b) => a.timestamp - b.timestamp);
    } catch {
      return [];
    }
  }

  async updateMessageStatus(messageId: string, status: DeviceMessage['status']): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        const req = store.get(messageId);
        req.onsuccess = () => {
          if (req.result) {
            const updated = { ...req.result, status };
            store.put(updated);
          }
          resolve();
        };
        req.onerror = () => resolve();
      });
    }
  }

  async deleteMessage(messageId: string, conversationId: string): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        store.delete(messageId);
        resolve();
      });
    } else {
      const msgs = this.getMessagesFromLocalStorage(conversationId).filter((m) => m.id !== messageId);
      localStorage.setItem(`haider_msgs_${conversationId}`, JSON.stringify(msgs));
    }
  }

  // --- Conversations ---

  async saveConversation(conv: PrivateConversation): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('conversations', 'readwrite');
        tx.objectStore('conversations').put(conv);
        resolve();
      });
    } else {
      const all = this.getConversationsFromLocalStorage();
      const updated = all.filter((c) => c.id !== conv.id);
      updated.unshift(conv);
      localStorage.setItem('haider_conversations', JSON.stringify(updated));
    }
  }

  async getConversations(): Promise<PrivateConversation[]> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('conversations', 'readonly');
        const req = tx.objectStore('conversations').getAll();
        req.onsuccess = () => {
          const list = (req.result as PrivateConversation[]) || [];
          list.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(list);
        };
        req.onerror = () => resolve(this.getConversationsFromLocalStorage());
      });
    }
    return this.getConversationsFromLocalStorage();
  }

  private getConversationsFromLocalStorage(): PrivateConversation[] {
    try {
      const data = localStorage.getItem('haider_conversations');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Groups ---

  async saveGroup(group: GroupChat): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('groups', 'readwrite');
        tx.objectStore('groups').put(group);
        resolve();
      });
    } else {
      const all = this.getGroupsFromLocalStorage();
      const updated = all.filter((g) => g.id !== group.id);
      updated.unshift(group);
      localStorage.setItem('haider_groups', JSON.stringify(updated));
    }
  }

  async getGroups(): Promise<GroupChat[]> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('groups', 'readonly');
        const req = tx.objectStore('groups').getAll();
        req.onsuccess = () => {
          const list = (req.result as GroupChat[]) || [];
          list.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(list);
        };
        req.onerror = () => resolve(this.getGroupsFromLocalStorage());
      });
    }
    return this.getGroupsFromLocalStorage();
  }

  private getGroupsFromLocalStorage(): GroupChat[] {
    try {
      const data = localStorage.getItem('haider_groups');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('groups', 'readwrite');
        tx.objectStore('groups').delete(groupId);
        resolve();
      });
    } else {
      const all = this.getGroupsFromLocalStorage().filter((g) => g.id !== groupId);
      localStorage.setItem('haider_groups', JSON.stringify(all));
    }
  }

  // --- Invitations ---

  async saveInvitation(invite: GroupInvitation): Promise<void> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('invitations', 'readwrite');
        tx.objectStore('invitations').put(invite);
        resolve();
      });
    } else {
      const all = this.getInvitationsFromLocalStorage();
      const updated = all.filter((i) => i.id !== invite.id);
      updated.unshift(invite);
      localStorage.setItem('haider_invitations', JSON.stringify(updated));
    }
  }

  async getInvitations(): Promise<GroupInvitation[]> {
    await this.isReady;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction('invitations', 'readonly');
        const req = tx.objectStore('invitations').getAll();
        req.onsuccess = () => resolve((req.result as GroupInvitation[]) || []);
        req.onerror = () => resolve(this.getInvitationsFromLocalStorage());
      });
    }
    return this.getInvitationsFromLocalStorage();
  }

  private getInvitationsFromLocalStorage(): GroupInvitation[] {
    try {
      const data = localStorage.getItem('haider_invitations');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Clear all local data
  async clearAllData(): Promise<void> {
    localStorage.clear();
    if (this.db) {
      const storeNames = ['messages', 'conversations', 'groups', 'invitations', 'devices'];
      const tx = this.db.transaction(storeNames, 'readwrite');
      storeNames.forEach((s) => tx.objectStore(s).clear());
    }
  }
}

export const storageService = new StorageService();
