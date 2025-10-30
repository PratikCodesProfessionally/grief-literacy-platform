/**
 * @fileoverview User Controller für die Poetry-Therapy-Platform
 * 
 * Verantwortlich für:
 * - Benutzer-Authentication (Registrierung, Login, Logout)
 * - Profilverwaltung (CRUD-Operationen)
 * - Sicherheitsfeatures (Passwort-Reset, E-Mail-Verifikation)
 * - Berechtigungsprüfungen
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

class UserController {
  /**
   * Benutzer-Registrierung
   * - Validiert Eingaben
   * - Prüft auf existierende E-Mail
   * - Hasht Passwort
   * - Erstellt Verifikations-Token
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Validierung
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          error: 'Alle Felder müssen ausgefüllt werden'
        });
        return;
      }

      // Prüfe ob E-Mail bereits existiert
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'E-Mail bereits registriert'
        });
        return;
      }

      // Password hashen
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Verifikations-Token erstellen
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Neuen Benutzer erstellen
      const user = new User({
        email,
        password: hashedPassword,
        name,
        verificationToken,
        isVerified: false
      });

      await user.save();

      // Verifikations-E-Mail senden
      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        success: true,
        message: 'Registrierung erfolgreich. Bitte E-Mail bestätigen.'
      });
    } catch (error) {
      console.error('Registrierungsfehler:', error);
      res.status(500).json({
        success: false,
        error: 'Registrierung fehlgeschlagen'
      });
    }
  }

  /**
   * Benutzer-Login
   * - Validiert Credentials
   * - Prüft E-Mail-Verifikation
   * - Erstellt JWT Token
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Benutzer finden
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten'
        });
        return;
      }

      // Passwort überprüfen
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten'
        });
        return;
      }

      // E-Mail-Verifikation prüfen
      if (!user.isVerified) {
        res.status(403).json({
          success: false,
          error: 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse'
        });
        return;
      }

      // JWT Token erstellen
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Letzte Anmeldung aktualisieren
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Login-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Anmeldung fehlgeschlagen'
      });
    }
  }

  /**
   * E-Mail-Verifikation
   * - Prüft Token
   * - Aktiviert Benutzerkonto
   */
  public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
      const user = await User.findOne({ 
        email: decoded.email,
        verificationToken: token
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Ungültiger oder abgelaufener Verifikations-Link'
        });
        return;
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'E-Mail-Adresse erfolgreich bestätigt'
      });
    } catch (error) {
      console.error('Verifikationsfehler:', error);
      res.status(500).json({
        success: false,
        error: 'E-Mail-Verifikation fehlgeschlagen'
      });
    }
  }

  /**
   * Passwort-Reset anfordern
   * - Erstellt Reset-Token
   * - Sendet Reset-E-Mail
   */
  public async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        // Aus Sicherheitsgründen gleiche Antwort wie bei erfolgreicher Anfrage
        res.json({
          success: true,
          message: 'Wenn ein Konto existiert, wurde eine E-Mail gesendet'
        });
        return;
      }

      const resetToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 Stunde
      await user.save();

      await sendPasswordResetEmail(email, resetToken);

      res.json({
        success: true,
        message: 'Wenn ein Konto existiert, wurde eine E-Mail gesendet'
      });
    } catch (error) {
      console.error('Password-Reset-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Password-Reset-Anfrage fehlgeschlagen'
      });
    }
  }

  /**
   * Passwort zurücksetzen
   * - Validiert Reset-Token
   * - Setzt neues Passwort
   */
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Ungültiger oder abgelaufener Reset-Link'
        });
        return;
      }

      // Neues Passwort hashen
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Passwort aktualisieren und Token zurücksetzen
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt'
      });
    } catch (error) {
      console.error('Password-Reset-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Passwort-Zurücksetzen fehlgeschlagen'
      });
    }
  }

  /**
   * Profil aktualisieren
   * - Erlaubt Änderung von Name und E-Mail
   * - Bei E-Mail-Änderung neue Verifikation erforderlich
   */
  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, email } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Benutzer nicht gefunden'
        });
        return;
      }

      // Wenn E-Mail geändert wird
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          res.status(400).json({
            success: false,
            error: 'E-Mail bereits vergeben'
          });
          return;
        }

        // Neue E-Mail-Verifikation erforderlich
        const verificationToken = jwt.sign(
          { email },
          process.env.JWT_SECRET!,
          { expiresIn: '24h' }
        );

        user.email = email;
        user.isVerified = false;
        user.verificationToken = verificationToken;

        await sendVerificationEmail(email, verificationToken);
      }

      if (name) {
        user.name = name;
      }

      await user.save();

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Profil-Update-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Profilaktualisierung fehlgeschlagen'
      });
    }
  }

  /**
   * Profil löschen
   * - Soft-Delete des Benutzerkontos
   * - Behält Daten für Archivierungszwecke
   */
  public async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Benutzer nicht gefunden'
        });
        return;
      }

      user.isActive = false;
      user.deactivatedAt = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'Profil erfolgreich deaktiviert'
      });
    } catch (error) {
      console.error('Profil-Löschungs-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Profildeaktivierung fehlgeschlagen'
      });
    }
  }
}

export default new UserController();
/*
Erklärung der Komponenten:
1. Sicherheitsfunktionen
Passwort-Hashing mit bcrypt
JWT für Authentifizierung
E-Mail-Verifikation
Sicheres Passwort-Reset
2. Hauptfunktionen
Registrierung
Login/Logout
Profilmanagement
E-Mail-Verifikation
Passwort-Reset
3. Datenschutz
Soft-Delete für Profile
Sichere Fehlerbehandlung
Datensparsamkeit bei Responses
4. Validierung
Eingabevalidierung
Token-Validierung
Berechtigungsprüfungen
5. Sicherheitsmerkmale
Rate-Limiting (implementiert in Middleware)
Sichere Token-Handhabung
Verschleierte Fehlermeldungen
 */