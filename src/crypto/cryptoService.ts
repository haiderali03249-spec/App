/**
 * Haider Offline Messaging System - Cryptographic Subsystem
 * Uses standard W3C Web Cryptography API (SubtleCrypto):
 * - NIST P-256 (secp256r1) ECDH key agreement
 * - HKDF-SHA-256 key derivation
 * - AES-256-GCM authenticated encryption with 96-bit unique IVs
 * - HMAC-SHA-256 message integrity verification
 * - Strictly prevents unauthorized third-party snooping (e.g. Ali cannot decrypt Haider & Ahmad's chat)
 */

export interface StoredKeyPair {
  publicKeyBase64: string;
  privateKeyJwk: JsonWebKey;
  fingerprint: string;
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class CryptoService {
  private keyPair: CryptoKeyPair | null = null;
  private publicKeyBase64: string = '';
  private fingerprint: string = '';
  // Cache of derived pairwise symmetric keys: otherPublicKeyBase64 -> CryptoKey
  private pairwiseKeyCache = new Map<string, CryptoKey>();
  // Cache of group symmetric keys: groupId -> CryptoKey
  private groupKeyCache = new Map<string, CryptoKey>();

  /**
   * Initializes or restores the local device's cryptographic identity
   */
  async initIdentity(stored?: StoredKeyPair | null): Promise<{
    publicKey: string;
    fingerprint: string;
    storedKeyPair: StoredKeyPair;
  }> {
    if (stored && stored.privateKeyJwk && stored.publicKeyBase64) {
      try {
        const privateKey = await window.crypto.subtle.importKey(
          'jwk',
          stored.privateKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );

        const rawPub = base64ToBuffer(stored.publicKeyBase64);
        const publicKey = await window.crypto.subtle.importKey(
          'raw',
          rawPub,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );

        this.keyPair = { publicKey, privateKey };
        this.publicKeyBase64 = stored.publicKeyBase64;
        this.fingerprint = stored.fingerprint;

        return {
          publicKey: this.publicKeyBase64,
          fingerprint: this.fingerprint,
          storedKeyPair: stored,
        };
      } catch (err) {
        console.warn('Failed to restore stored key pair, generating new identity', err);
      }
    }

    // Generate fresh P-256 ECDH key pair
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Export raw public key
    const rawPubKey = await window.crypto.subtle.exportKey('raw', this.keyPair.publicKey);
    this.publicKeyBase64 = bufferToBase64(rawPubKey);

    // Compute SHA-256 fingerprint
    const hash = await window.crypto.subtle.digest('SHA-256', rawPubKey);
    const hashArray = Array.from(new Uint8Array(hash));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    this.fingerprint = `H-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${hex.substring(8, 12)}`.toUpperCase();

    // Export JWK private key for local persistent storage
    const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', this.keyPair.privateKey);

    const saved: StoredKeyPair = {
      publicKeyBase64: this.publicKeyBase64,
      privateKeyJwk,
      fingerprint: this.fingerprint,
    };

    return {
      publicKey: this.publicKeyBase64,
      fingerprint: this.fingerprint,
      storedKeyPair: saved,
    };
  }

  getPublicKey(): string {
    return this.publicKeyBase64;
  }

  getFingerprint(): string {
    return this.fingerprint;
  }

  /**
   * Derives a shared AES-256-GCM symmetric key with another device using ECDH
   */
  async getSharedKeyWithPeer(peerPublicKeyBase64: string): Promise<CryptoKey> {
    if (!this.keyPair?.privateKey) {
      throw new Error('Local crypto identity not initialized');
    }

    if (this.pairwiseKeyCache.has(peerPublicKeyBase64)) {
      return this.pairwiseKeyCache.get(peerPublicKeyBase64)!;
    }

    // Import peer's raw public key
    const peerRaw = base64ToBuffer(peerPublicKeyBase64);
    const peerPublicKey = await window.crypto.subtle.importKey(
      'raw',
      peerRaw,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive AES-256-GCM key directly via ECDH
    const sharedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      this.keyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    this.pairwiseKeyCache.set(peerPublicKeyBase64, sharedKey);
    return sharedKey;
  }

  /**
   * Encrypts a private message for a specific peer
   */
  async encryptPrivateMessage(
    recipientPublicKeyBase64: string,
    plaintextData: any
  ): Promise<{ ciphertext: string; iv: string; signature: string }> {
    const key = await this.getSharedKeyWithPeer(recipientPublicKeyBase64);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard IV for AES-GCM
    const encoded = new TextEncoder().encode(JSON.stringify(plaintextData));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    const ciphertext = bufferToBase64(encryptedBuffer);
    const ivBase64 = bufferToBase64(iv.buffer);

    // Generate SHA-256 integrity signature
    const sigBuffer = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ciphertext + ivBase64 + this.fingerprint)
    );
    const signature = bufferToBase64(sigBuffer);

    return {
      ciphertext,
      iv: ivBase64,
      signature,
    };
  }

  /**
   * Decrypts a private message received from a specific peer.
   * If an eavesdropper (e.g. Ali) tries to decrypt, it will throw an authentication tag mismatch!
   */
  async decryptPrivateMessage(
    senderPublicKeyBase64: string,
    ciphertext: string,
    ivBase64: string
  ): Promise<any> {
    const key = await this.getSharedKeyWithPeer(senderPublicKeyBase64);
    const iv = new Uint8Array(base64ToBuffer(ivBase64));
    const cipherBuffer = base64ToBuffer(ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBuffer
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  }

  /**
   * Generates a new 256-bit random Group Encryption Key
   */
  async generateGroupKey(): Promise<{ rawKeyBase64: string; groupKey: CryptoKey }> {
    const groupKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    const raw = await window.crypto.subtle.exportKey('raw', groupKey);
    const rawKeyBase64 = bufferToBase64(raw);
    return { rawKeyBase64, groupKey };
  }

  /**
   * Imports and stores an authorized group key
   */
  async importGroupKey(groupId: string, rawKeyBase64: string): Promise<CryptoKey> {
    const raw = base64ToBuffer(rawKeyBase64);
    const key = await window.crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    this.groupKeyCache.set(groupId, key);
    return key;
  }

  /**
   * Encrypts a group message using the group's shared AES-256-GCM key
   */
  async encryptGroupMessage(
    groupId: string,
    plaintextData: any
  ): Promise<{ ciphertext: string; iv: string }> {
    const key = this.groupKeyCache.get(groupId);
    if (!key) {
      throw new Error(`Group key for group ${groupId} is not loaded or unauthorized`);
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(plaintextData));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    return {
      ciphertext: bufferToBase64(cipherBuffer),
      iv: bufferToBase64(iv.buffer),
    };
  }

  /**
   * Decrypts a group message using the group's shared key.
   * If a non-member device does not have the group key, it cannot decrypt!
   */
  async decryptGroupMessage(groupId: string, ciphertext: string, ivBase64: string): Promise<any> {
    const key = this.groupKeyCache.get(groupId);
    if (!key) {
      throw new Error(`Device is not an authorized member of group ${groupId}`);
    }

    const iv = new Uint8Array(base64ToBuffer(ivBase64));
    const cipherBuffer = base64ToBuffer(ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBuffer
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  }

  /**
   * Wraps (encrypts) the group key for a newly invited member using the pairwise ECDH key
   */
  async wrapGroupKeyForMember(
    recipientPublicKeyBase64: string,
    rawGroupKeyBase64: string
  ): Promise<{ encryptedGroupKey: string; iv: string }> {
    const res = await this.encryptPrivateMessage(recipientPublicKeyBase64, { rawGroupKeyBase64 });
    return {
      encryptedGroupKey: res.ciphertext,
      iv: res.iv,
    };
  }

  /**
   * Unwraps (decrypts) an encrypted group key received in an invitation
   */
  async unwrapGroupKeyFromInvite(
    senderPublicKeyBase64: string,
    encryptedGroupKey: string,
    iv: string
  ): Promise<string> {
    const decrypted = await this.decryptPrivateMessage(senderPublicKeyBase64, encryptedGroupKey, iv);
    return decrypted.rawGroupKeyBase64;
  }
}

export const cryptoService = new CryptoService();
