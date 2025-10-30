/**
 * @fileoverview User Model für die Poetry-Therapy-Platform
 *
 * Dieses Model definiert:
 * - Benutzerstruktur
 * - Authentifizierung
 * - Profilverwaltung
 * - Sicherheitsfeatures
 */
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
/**
 * Schema-Definition für Benutzer
 */
const UserSchema = new Schema({
    // Basis-Informationen
    email: {
        type: String,
        required: [true, 'E-Mail ist erforderlich'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Bitte geben Sie eine gültige E-Mail-Adresse ein'
        ]
    },
    password: {
        type: String,
        required: [true, 'Passwort ist erforderlich'],
        minlength: [8, 'Passwort muss mindestens 8 Zeichen lang sein'],
        select: false // Passwort wird standardmäßig nicht abgerufen
    },
    name: {
        type: String,
        required: [true, 'Name ist erforderlich'],
        trim: true,
        maxlength: [50, 'Name darf maximal 50 Zeichen lang sein']
    },
    // Verifizierung und Sicherheit
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    // Account-Status
    isActive: {
        type: Boolean,
        default: true
    },
    deactivatedAt: Date,
    // Benutzereinstellungen
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: 'de',
            enum: ['de', 'en']
        },
        theme: {
            type: String,
            default: 'system',
            enum: ['light', 'dark', 'system']
        }
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin', 'moderator']
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.verificationToken;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordExpires;
            delete ret.__v;
            return ret;
        }
    }
});
/**
 * Indices für Performance-Optimierung
 */
UserSchema.index({ email: 1 });
UserSchema.index({ isActive: 1 });
/**
 * Middleware: Password Hashing
 */
UserSchema.pre('save', async function (next) {
    const user = this;
    // Nur neu hashen, wenn das Passwort geändert wurde
    if (!user.isModified('password')) {
        return next();
    }
    try {
        // Generiere Salt und Hash
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
/**
 * Methode zum Passwort-Vergleich
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        // this.password ist gehashed
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error('Passwortvergleich fehlgeschlagen');
    }
};
/**
 * Statische Methoden
 */
UserSchema.statics = {
    /**
     * Findet aktive Benutzer
     */
    findActive: function () {
        return this.find({ isActive: true });
    },
    /**
     * Findet Benutzer nach E-Mail
     */
    findByEmail: function (email) {
        return this.findOne({ email: email.toLowerCase() });
    }
};
/**
 * Virtuelle Felder
 */
UserSchema.virtual('isDeactivated').get(function () {
    return !this.isActive;
});
// Model erstellen und exportieren
const User = mongoose.model('User', UserSchema);
/**
 * Erklärung der Komponenten:
1. Interface (IUser)
Definiert Typescript-Typen für Benutzer
Enthält alle Benutzer-Eigenschaften und Methoden
2. Schema-Definition
Basis-Informationen: email, password, name
Sicherheit: isVerified, verificationToken, resetPasswordToken
Status: isActive, deactivatedAt
Einstellungen: preferences (notifications, language, theme)
3. Sicherheitsfeatures
Passwort-Hashing mit bcrypt
Selektive Feldauswahl
Token-Management
E-Mail-Validierung
4. Methoden und Middleware
comparePassword(): Sichere Passwortüberprüfung
Pre-save Hook für Passwort-Hashing
Statische Hilfsmethoden
JSON-Transformation
5. Besonderheiten
E-Mail-Validierung per Regex
Mehrsprachunterstützung
Theme-Präferenzen
Soft-Delete Funktionalität
*/ export { User };
export default User;
