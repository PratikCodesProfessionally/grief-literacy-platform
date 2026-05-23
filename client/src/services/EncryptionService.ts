/**
 * Client-Side Encryption Service
 * Uses AES-256-GCM for zero-knowledge encryption
 * Server never sees plaintext journal content
 */

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export class EncryptionService {
  private static ALGORITHM = 'AES-GCM';
  private static KEY_LENGTH = 256;
  private static IV_LENGTH = 12; // 96 bits recommended for GCM
  private static SALT_LENGTH = 16;
  private static ITERATIONS = 100000; // PBKDF2 iterations
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  /**
   * Derive encryption key from user's password using PBKDF2
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

      return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate random bytes for IV or salt
   */
  private static generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Encrypt plaintext data with password
   */
  static async encrypt(
    plaintext: string,
    password: string
  ): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = this.generateRandomBytes(this.SALT_LENGTH);
      const iv = this.generateRandomBytes(this.IV_LENGTH);

      // Derive encryption key from password
      const key = await this.deriveKey(password, salt);

      // Encrypt the data
      const plaintextBytes = this.encoder.encode(plaintext);
      const ciphertextBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv as BufferSource,
        },
        key,
        plaintextBytes
      );

      return {
        ciphertext: this.arrayBufferToBase64(ciphertextBuffer),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt ciphertext with password
   */
  static async decrypt(
    encryptedData: EncryptedData,
    password: string
  ): Promise<string> {
    try {
      // Convert base64 strings back to Uint8Arrays
      const salt = this.base64ToArrayBuffer(encryptedData.salt);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

      // Derive the same key from password and salt
      const key = await this.deriveKey(password, salt);

      // Decrypt the data
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv as BufferSource,
        },
        key,
        ciphertext as BufferSource
      );

      return this.decoder.decode(plaintextBuffer);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - incorrect password or corrupted data');
    }
  }

  /**
   * Hash password for storage (not used for encryption)
   * Used to verify user's encryption password without storing it
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = this.generateRandomBytes(this.SALT_LENGTH);
    const key = await this.deriveKey(password, salt);
    const keyBytes = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(salt) + ':' + this.arrayBufferToBase64(keyBytes);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const [saltBase64, expectedKeyBase64] = hash.split(':');
      const salt = this.base64ToArrayBuffer(saltBase64);
      const key = await this.deriveKey(password, salt);
      const keyBytes = await crypto.subtle.exportKey('raw', key);
      const actualKeyBase64 = this.arrayBufferToBase64(keyBytes);
      return actualKeyBase64 === expectedKeyBase64;
    } catch {
      return false;
    }
  }

  /**
   * Generate a device ID for sync tracking
   */
  static generateDeviceId(): string {
    const stored = localStorage.getItem('grief-platform-device-id');
    if (stored) return stored;

    const deviceId = crypto.randomUUID();
    localStorage.setItem('grief-platform-device-id', deviceId);
    return deviceId;
  }

  /**
   * Check if encryption is enabled in environment
   */
  static isEncryptionEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';
  }
}
