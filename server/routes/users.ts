// @ts-nocheck
import express from 'express';
import { auth, authLimiter } from '../middleware/auth.js';
import userController from '../controllers/userController.js';

const router = express.Router();

// POST /api/users/register - Registrierung
router.post('/register',
  authLimiter,
  (req, res) => userController.register(req, res)
);

// POST /api/users/login - Login
router.post('/login',
  authLimiter,
  (req, res) => userController.login(req, res)
);

// GET /api/users/verify/:token - E-Mail-Verifikation
router.get('/verify/:token',
  (req, res) => userController.verifyEmail(req, res)
);

// POST /api/users/password-reset-request - Passwort-Reset anfordern
router.post('/password-reset-request',
  authLimiter,
  (req, res) => userController.requestPasswordReset(req, res)
);

// POST /api/users/password-reset - Passwort zurücksetzen
router.post('/password-reset',
  authLimiter,
  (req, res) => userController.resetPassword(req, res)
);

// PUT /api/users/me - Profil aktualisieren
router.put('/me',
  auth.verified,
  (req, res) => userController.updateProfile(req, res)
);

// DELETE /api/users/me - Profil löschen
router.delete('/me',
  auth.verified,
  (req, res) => userController.deleteProfile(req, res)
);

export default router;
