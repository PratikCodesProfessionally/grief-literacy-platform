/**
 * @fileoverview Verschlüsselungs-Middleware für die Poetry-Therapy-Platform
 * 
 * Diese Middleware implementiert:
 * - Symmetrische Verschlüsselung (AES-GCM)
 * - Sichere Schlüsselverwaltung
 * - Transparente Ver-/Entschlüsselung von Requests/Responses
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyLength: number;
  ivLength: number;
  authTagLength: number;
}

/**
 * Standard-Konfiguration für die Verschlüsselung
 */
const encryptionConfig: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bit
  ivLength: 12,  // 96 bit (empfohlen für GCM)
  authTagLength: 16 // 128 bit
};

/**
 * Klasse für Verschlüsselungsoperationen
 */
class Encryptor {
  private readonly config: EncryptionConfig;

  constructor(config: EncryptionConfig = encryptionConfig) {
    this.config = config;
  }

  /**
   * Verschlüsselt Daten mit einem gegebenen Schlüssel
   */
  async encrypt(data: any, key: Buffer): Promise<{
    encrypted: string;
    iv: string;
    authTag: string;
  }> {
    try {
      // Generiere zufälligen IV
      const iv = crypto.randomBytes(this.config.ivLength);

      // Erstelle Cipher
      const cipher = crypto.createCipheriv(
        this.config.algorithm,
        key,
        iv
      );

      // Verschlüssele Daten
      const jsonData = JSON.stringify(data);
      let encrypted = cipher.update(jsonData, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Hole Authentication Tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      };
    } catch (error) {
      console.error('Verschlüsselungsfehler:', error);
      throw new Error('Verschlüsselung fehlgeschlagen');
    }
  }

  /**
   * Entschlüsselt Daten mit einem gegebenen Schlüssel
   */
  async decrypt(
    encrypted: string,
    key: Buffer,
    iv: string,
    authTag: string
  ): Promise<any> {
    try {
      // Erstelle Decipher
      const decipher = crypto.createDecipheriv(
        this.config.algorithm,
        key,
        Buffer.from(iv, 'base64')
      );

      // Setze Authentication Tag
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));

      // Entschlüssele Daten
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Entschlüsselungsfehler:', error);
      throw new Error('Entschlüsselung fehlgeschlagen');
    }
  }
}

// Singleton-Instanz des Encryptors
const encryptor = new Encryptor();

/**
 * Middleware für Request-Verschlüsselung
 */
export const encryptRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.body || !req.body.encrypt) {
      return next();
    }

    // Hole Benutzer-spezifischen Schlüssel
    const userKey = await getUserEncryptionKey(req.user?.id);
    
    // Verschlüssele Daten
    const { encrypted, iv, authTag } = await encryptor.encrypt(
      req.body.data,
      userKey
    );

    // Ersetze Body mit verschlüsselten Daten
    req.body = {
      encrypted,
      iv,
      authTag,
      isEncrypted: true
    };

    next();
  } catch (error) {
    console.error('Request-Verschlüsselungsfehler:', error);
    res.status(500).json({
      success: false,
      error: 'Verschlüsselungsfehler'
    });
  }
};

/**
 * Middleware für Response-Entschlüsselung
 */
export const decryptResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const oldJson = res.json;
    res.json = function(data) {
      if (data && data.isEncrypted) {
        // Entschlüssele Daten vor dem Senden
        return getUserEncryptionKey(req.user?.id)
          .then(userKey => encryptor.decrypt(
            data.encrypted,
            userKey,
            data.iv,
            data.authTag
          ))
          .then(decrypted => oldJson.call(this, decrypted));
      }
      return oldJson.call(this, data);
    };
    next();
  } catch (error) {
    console.error('Response-Entschlüsselungsfehler:', error);
    res.status(500).json({
      success: false,
      error: 'Entschlüsselungsfehler'
    });
  }
};

/**
 * Hilfsfunktion: Holt Benutzer-spezifischen Verschlüsselungsschlüssel
 */
async function getUserEncryptionKey(userId?: string): Promise<Buffer> {
  if (!userId) {
    throw new Error('Kein Benutzer gefunden');
  }

  // TODO: Implementiere sichere Schlüsselverwaltung
  // Hier sollte der Schlüssel aus einem sicheren Speicher geholt werden
  // z.B. AWS KMS, HashiCorp Vault, etc.
  
  // Temporäre Implementation für Entwicklung
  return crypto.createHash('sha256')
    .update(userId + process.env.ENCRYPTION_SECRET!)
    .digest();
}

export default {
  encryptRequest,
  decryptResponse
};

/**
 * Erklärung der Komponenten:
 * 1. Verschlüsselungskonfiguration
AES-256-GCM als sicherer Algorithmus
Konfigurierbare Schlüssellängen
Authentifizierung durch GCM-Modus
2. Encryptor-Klasse
Ver- und Entschlüsselung von Daten
Sichere IV-Generierung
Authentifizierungs-Tags
3. Middleware-Funktionen
encryptRequest: Verschlüsselt eingehende Daten
decryptResponse: Entschlüsselt ausgehende Daten
4. Sicherheitsmerkmale
Benutzer-spezifische Schlüssel
Authentifizierte Verschlüsselung
Fehlerbehandlung
5. Verwendung
// In einer Route-Definition:
router.post('/poems',
  auth.verified,
  encryptRequest,
  decryptResponse,
  (req, res) => {
    // Daten sind hier automatisch ver-/entschlüsselt
  }
);
*/