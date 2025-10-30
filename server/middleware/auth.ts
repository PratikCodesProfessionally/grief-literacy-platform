/**
 * @fileoverview Auth Middleware für die Poetry-Therapy-Platform
 * 
 * Diese Middleware ist verantwortlich für:
 * - JWT Token Validierung
 * - Benutzer-Authentifizierung
 * - Rollen-basierte Zugriffskontrolle
 * - Rate Limiting
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import User, { IUser } from '../models/User.js';
import { logger } from '../utils/logger.js';

// Erweitere Express Request Type
declare module 'express' {
  interface Request {
    user?: IUser;
    isAdmin?: boolean;
  }
}

/**
 * Rate Limiter Konfiguration
 * Begrenzt API-Anfragen pro IP-Adresse
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit pro IP
  message: {
    error: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strikte Rate Limits für Auth-Endpunkte
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5, // 5 Versuche pro Stunde
  message: {
    error: 'Zu viele Login-Versuche, bitte warten Sie eine Stunde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Hauptauthentifizierungs-Middleware
 * Validiert JWT Token und lädt Benutzer
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Token aus Header extrahieren
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Keine Authentifizierung'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Token validieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    // Benutzer laden
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Benutzer nicht gefunden oder deaktiviert'
      });
      return;
    }

    // Benutzer an Request anfügen
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token abgelaufen'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Ungültiger Token'
      });
      return;
    }

    console.error('Auth-Middleware-Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Authentifizierungsfehler'
    });
  }
};

/**
 * Middleware für verifizierte Benutzer
 * Prüft, ob E-Mail bestätigt wurde
 */
export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isVerified) {
    res.status(403).json({
      success: false,
      error: 'E-Mail-Adresse muss bestätigt werden'
    });
    return;
  }
  next();
};

/**
 * Middleware für Admin-Zugriff
 * Prüft Admin-Berechtigung
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin || req.user.role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user ${req.user?.id || 'unknown'}`, {
      userId: req.user?.id,
      userRole: req.user?.role,
      path: req.path
    });
    res.status(403).json({
      success: false,
      error: 'Admin-Berechtigung erforderlich'
    });
    return;
  }
  next();
};

/**
 * Middleware für API-Versionsüberprüfung
 * Optional: Prüft API-Version im Header
 */
export const checkApiVersion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiVersion = req.headers['x-api-version'];
  const minVersion = '1.0.0';

  if (!apiVersion || apiVersion < minVersion) {
    res.status(426).json({
      success: false,
      error: 'Bitte aktualisieren Sie Ihren Client',
      minVersion
    });
    return;
  }
  next();
};

/**
 * Kombinierte Auth-Middleware
 * Verkettung mehrerer Middleware-Funktionen
 */
export const auth = {
  basic: [apiLimiter, authenticate],
  verified: [apiLimiter, authenticate, requireVerified],
  admin: [apiLimiter, authenticate, requireVerified, requireAdmin]
};

export default auth;


/**
 * Erklärung der Komponenten:
1. Rate Limiting
apiLimiter: Allgemeine API-Ratenbegrenzung
authLimiter: Spezielle Limits für Auth-Endpunkte
2. Hauptauthentifizierung
JWT Token Validierung
Benutzerladung aus Datenbank
Fehlerbehandlung für verschiedene Token-Probleme
3. Zusätzliche Middleware
requireVerified: Prüft E-Mail-Verifikation
requireAdmin: Prüft Admin-Berechtigung
checkApiVersion: API-Versionskompatibilität
4. Sicherheitsfeatures
Token-Extraktion aus Header
Benutzer-Statusprüfung
Detaillierte Fehlermeldungen
5. Verwendung
// In einer Route-Definition:
router.get('/protected', 
  auth.basic, 
  (req, res) => {
    // Route-Handler
  }
);

// Für verifizierte Benutzer:
router.post('/poems',
  auth.verified,
  (req, res) => {
    // Route-Handler
  }
);

// Für Admin-Zugriff:
router.delete('/users/:id',
  auth.admin,
  (req, res) => {
    // Route-Handler
  }
);
*/
