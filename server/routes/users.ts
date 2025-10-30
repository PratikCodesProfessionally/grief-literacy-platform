/**
 * @fileoverview Router für Benutzer-bezogene Endpunkte
 * 
 * Implementiert Endpoints für:
 * - Authentifizierung (Registrierung, Login, Logout)
 * - Profilverwaltung
 * - Passwort-Reset
 * - E-Mail-Verifikation
 */

import express from 'express';
import { auth, authLimiter } from '../middleware/auth';
import userController from '../controllers/userController';

const router = express.Router();

/**
 * POST /api/users/register
 * Neue Benutzerregistrierung
 * 
 * Body:
 * - email: E-Mail-Adresse
 * - password: Passwort
 * - name: Benutzername
 */
router.post('/register',
  authLimiter,
  userController.register
);

/**
 * POST /api/users/login
 * Benutzeranmeldung
 * 
 * Body:
 * - email: E-Mail-Adresse
 * - password: Passwort
 */
router.post('/login',
  authLimiter,
  userController.login
);

/**
 * POST /api/users/logout
 * Benutzerabmeldung
 */
router.post('/logout',
  auth.basic,
  userController.logout
);

/**
 * GET /api/users/verify/:token
 * E-Mail-Verifikation
 */
router.get('/verify/:token',
  userController.verifyEmail
);

/**
 * POST /api/users/password-reset-request
 * Passwort-Reset anfordern
 * 
 * Body:
 * - email: E-Mail-Adresse
 */
router.post('/password-reset-request',
  authLimiter,
  userController.requestPasswordReset
);

/**
 * POST /api/users/password-reset
 * Passwort zurücksetzen
 * 
 * Body:
 * - token: Reset-Token
 * - newPassword: Neues Passwort
 */
router.post('/password-reset',
  authLimiter,
  userController.resetPassword
);

/**
 * GET /api/users/me
 * Eigenes Profil abrufen
 */
router.get('/me',
  auth.verified,
  userController.getProfile
);

/**
 * PUT /api/users/me
 * Profil aktualisieren
 * 
 * Body:
 * - name: Neuer Name (optional)
 * - email: Neue E-Mail (optional)
 * - preferences: Benutzereinstellungen (optional)
 */
router.put('/me',
  auth.verified,
  userController.updateProfile
);

/**
 * DELETE /api/users/me
 * Profil löschen (Soft-Delete)
 */
router.delete('/me',
  auth.verified,
  userController.deleteProfile
);

/**
 * POST /api/users/me/preferences
 * Benutzereinstellungen aktualisieren
 * 
 * Body:
 * - theme: 'light' | 'dark' | 'system'
 * - language: 'de' | 'en'
 * - emailNotifications: boolean
 */
router.post('/me/preferences',
  auth.verified,
  userController.updatePreferences
);

/**
 * PUT /api/users/me/password
 * Passwort ändern
 * 
 * Body:
 * - currentPassword: Aktuelles Passwort
 * - newPassword: Neues Passwort
 */
router.put('/me/password',
  auth.verified,
  authLimiter,
  userController.changePassword
);

// Admin-Routen
/**
 * GET /api/users
 * Alle Benutzer auflisten (nur Admin)
 */
router.get('/',
  auth.admin,
  userController.listUsers
);

/**
 * GET /api/users/:id
 * Spezifischen Benutzer abrufen (nur Admin)
 */
router.get('/:id',
  auth.admin,
  userController.getUser
);

/**
 * PUT /api/users/:id
 * Benutzer aktualisieren (nur Admin)
 */
router.put('/:id',
  auth.admin,
  userController.updateUser
);

export default router;

/**
 * Erklärung der Routen-Gruppen:
1. Authentifizierung
/register: Neue Benutzerregistrierung
/login: Anmeldung
/logout: Abmeldung
/verify/:token: E-Mail-Verifikation
2. Passwort-Management
/password-reset-request: Reset anfordern
/password-reset: Neues Passwort setzen
/me/password: Passwort ändern
3. Profilverwaltung
/me: Profil abrufen/aktualisieren/löschen
/me/preferences: Einstellungen verwalten
4. Admin-Funktionen
Benutzerverwaltung
Benutzersuche
Benutzeraktualisierung
Sicherheitsmerkmale:
Rate-Limiting für sensitive Endpunkte
Authentifizierung und Autorisierung
Rollenbasierte Zugriffskontrolle
# Registrierung
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "benutzer@beispiel.de",
    "password": "sicheres-passwort",
    "name": "Max Mustermann"
  }'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "benutzer@beispiel.de",
    "password": "sicheres-passwort"
  }'

# Profil abrufen
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"
  */