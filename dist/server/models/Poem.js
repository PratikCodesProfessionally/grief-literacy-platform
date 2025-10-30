/**
 * @fileoverview Poem Model für die Poetry-Therapy-Platform
 *
 * Dieses Model definiert die Struktur und Validierung für Gedichte.
 * Es unterstützt:
 * - Versionierung
 * - Verschlüsselung
 * - Mandantenfähigkeit
 * - Soft-Delete
 */
import mongoose, { Schema } from 'mongoose';
/**
 * Schema-Definition für Gedichte
 * Inkl. Validierung und Index-Definitionen
 */
const PoemSchema = new Schema({
    // Basis-Informationen
    title: {
        type: String,
        required: [true, 'Titel ist erforderlich'],
        trim: true,
        maxlength: [200, 'Titel darf maximal 200 Zeichen lang sein']
    },
    content: {
        type: String,
        required: [true, 'Inhalt ist erforderlich'],
        trim: true,
        maxlength: [50000, 'Inhalt darf maximal 50.000 Zeichen lang sein']
    },
    // Beziehungen und Berechtigungen
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Autor ist erforderlich'],
        index: true
    },
    isPrivate: {
        type: Boolean,
        default: true,
        index: true
    },
    // Verschlüsselungs-Informationen
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptedKey: {
        type: String,
        select: false // Wird standardmäßig nicht geladen
    },
    // Versionierung
    version: {
        type: Number,
        default: 1,
        min: [1, 'Version muss mindestens 1 sein']
    },
    // Kategorisierung
    tags: [{
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [30, 'Tags dürfen maximal 30 Zeichen lang sein']
        }],
    prompt: {
        type: String,
        trim: true
    },
    // Soft-Delete und Zeitstempel
    deletedAt: {
        type: Date,
        default: null,
        index: true
    }
}, {
    // Schema-Optionen
    timestamps: true, // Erstellt automatisch createdAt und updatedAt
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            delete ret.encryptedKey;
            return ret;
        }
    }
});
/**
 * Indices für Performance-Optimierung
 */
PoemSchema.index({ authorId: 1, createdAt: -1 });
PoemSchema.index({ tags: 1 });
PoemSchema.index({ title: 'text', content: 'text' }); // Volltext-Suche
/**
 * Virtuelle Felder
 */
PoemSchema.virtual('isDeleted').get(function () {
    return Boolean(this.deletedAt);
});
/**
 * Middleware (Pre-Hooks)
 */
PoemSchema.pre('find', function () {
    // Standardmäßig keine gelöschten Dokumente zurückgeben
    if (!this.getQuery().includeSoftDeleted) {
        this.where({ deletedAt: null });
    }
});
/**
 * Methoden
 */
PoemSchema.methods = {
    /**
     * Soft-Delete eines Gedichts
     */
    softDelete: async function () {
        this.deletedAt = new Date();
        await this.save();
    },
    /**
     * Wiederherstellen eines gelöschten Gedichts
     */
    restore: async function () {
        this.deletedAt = null;
        await this.save();
    },
    /**
     * Neue Version erstellen
     */
    createNewVersion: async function () {
        this.version += 1;
        await this.save();
    }
};
/**
 * Statische Methoden
 */
PoemSchema.statics = {
    /**
     * Suche nach Gedichten mit verschiedenen Filtern
     */
    findPoems: async function (filters) {
        const query = this.find({ deletedAt: null });
        if (filters.authorId) {
            query.where('authorId').equals(filters.authorId);
        }
        if (filters.tags && filters.tags.length > 0) {
            query.where('tags').all(filters.tags);
        }
        if (typeof filters.isPrivate === 'boolean') {
            query.where('isPrivate').equals(filters.isPrivate);
        }
        if (filters.search) {
            query.where({
                $text: { $search: filters.search }
            });
        }
        return query.sort({ createdAt: -1 });
    }
};
// Model erstellen und exportieren
export default mongoose.model('Poem', PoemSchema);
/**
 * Erklärung der wichtigsten Komponenten:
1. Interface (IPoem)
Definiert die Typescript-Typen
Erweitert mongoose.Document
Enthält alle Gedicht-Eigenschaften
2. Schema-Definition
Basis-Felder: title, content
Berechtigungen: authorId, isPrivate
Verschlüsselung: isEncrypted, encryptedKey
Versionierung: version
Kategorisierung: tags, prompt
Zeitstempel: createdAt, updatedAt, deletedAt
3. Schema-Optionen
Automatische Zeitstempel
JSON-Transformation
Index-Definitionen
Virtuelle Felder
4. Methoden
softDelete(): Soft-Delete Funktionalität
restore(): Wiederherstellung
createNewVersion(): Versionierung
Statische Suchmethode
5. Besondere Features
Volltext-Suche
Automatische Filterung gelöschter Dokumente
Flexible Suchmöglichkeiten
Sichere Handhabung sensibler Daten
*/ 
