/**
 * @fileoverview API-Client für die Poetry-Therapy-Plattform
 * 
 * Zentrale Stelle für:
 * - Backend-Kommunikation
 * - Request/Response Handling
 * - Verschlüsselung für Cloud-Sync
 * - Error Handling
 */

import { authService } from './AuthService';

/**
 * API Konfiguration
 */
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  encryption: boolean;
}

/**
 * API Response Format
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Verschlüsselungskonfiguration
 */
interface EncryptionConfig {
  algorithm: 'AES-GCM';
  keyLength: 256;
  ivLength: 12;
}

/**
 * API Fehlerklasse
 */
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Client Hauptklasse
 */
export class ApiClient {
  private static instance: ApiClient;
  private config: ApiConfig;
  private encryptionKey: CryptoKey | null = null;

  private readonly encryptionConfig: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12
  };

  private constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * Singleton-Instanz abrufen
   */
  public static getInstance(config?: ApiConfig): ApiClient {
    if (!ApiClient.instance) {
      if (!config) {
        throw new Error('Initial config required');
      }
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  /**
   * Verschlüsselungsschlüssel initialisieren
   */
  public async initializeEncryption(password: string): Promise<void> {
    if (!this.config.encryption) return;

    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const salt = encoder.encode('poetry-therapy-salt');
    this.encryptionKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.encryptionConfig.algorithm,
        length: this.encryptionConfig.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Daten verschlüsseln
   */
  private async encrypt(data: any): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    if (!this.encryptionKey) {
      throw new ApiError('Encryption not initialized');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(this.encryptionConfig.ivLength));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(data));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.encryptionConfig.algorithm,
        iv
      },
      this.encryptionKey,
      encoded
    );

    return { encrypted, iv };
  }

  /**
   * Daten entschlüsseln
   */
  private async decrypt(encrypted: ArrayBuffer, iv: Uint8Array): Promise<any> {
    if (!this.encryptionKey) {
      throw new ApiError('Encryption not initialized');
    }

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.encryptionConfig.algorithm,
        iv
      },
      this.encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  /**
   * Generic Request Methode
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    encrypt = false
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authService.getToken()}`
    };

    let body: string | undefined;
    if (data) {
      if (encrypt && this.config.encryption) {
        const { encrypted, iv } = await this.encrypt(data);
        headers['X-Encryption-IV'] = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        body = JSON.stringify({
          encrypted: Array.from(new Uint8Array(encrypted))
        });
      } else {
        body = JSON.stringify(data);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          response.statusText,
          response.status,
          await response.text()
        );
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || 'Unknown API error');
      }

      if (encrypt && this.config.encryption && result.data) {
        const iv = new Uint8Array(
          (result.data as any).iv.match(/.{2}/g)
            .map((byte: string) => parseInt(byte, 16))
        );
        return await this.decrypt((result.data as any).encrypted, iv);
      }

      return result.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout');
      }
      throw new ApiError(error.message);
    }
  }

  /**
   * HTTP GET Request
   */
  public async get<T>(endpoint: string, encrypt = false): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, encrypt);
  }

  /**
   * HTTP POST Request
   */
  public async post<T>(endpoint: string, data: any, encrypt = false): Promise<T> {
    return this.request<T>('POST', endpoint, data, encrypt);
  }

  /**
   * HTTP PUT Request
   */
  public async put<T>(endpoint: string, data: any, encrypt = false): Promise<T> {
    return this.request<T>('PUT', endpoint, data, encrypt);
  }

  /**
   * HTTP PATCH Request
   */
  public async patch<T>(endpoint: string, data: any, encrypt = false): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, encrypt);
  }

  /**
   * HTTP DELETE Request
   */
  public async delete<T>(endpoint: string, encrypt = false): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, encrypt);
  }
}

/**
 * Standard API-Client Konfiguration
 */
export const defaultApiConfig: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 Sekunden
  encryption: true
};

/**
 * API-Client Instanz exportieren
 */
export const apiClient = ApiClient.getInstance(defaultApiConfig);

/**
 * @example Verwendungsbeispiel:
 * 
 * // Verschlüsselung initialisieren
 * await apiClient.initializeEncryption('sicheres-passwort');
 * 
 * // GET Request
 * const data = await apiClient.get<User>('/users/me');
 * 
 * // POST Request mit Verschlüsselung
 * const response = await apiClient.post('/poems', {
 *   title: 'Mein Gedicht',
 *   content: 'Geheimer Inhalt'
 * }, true);
 */