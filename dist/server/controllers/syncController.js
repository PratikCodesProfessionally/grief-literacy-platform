/**
 * @fileoverview Sync-Controller für die Poetry-Therapy-Platform
 *
 * Dieser Controller ist verantwortlich für:
 * - Bidirektionale Synchronisation zwischen Client und Server
 * - Konfliktbehandlung bei gleichzeitigen Änderungen
 * - Versionskontrolle und Änderungsverfolgung
 * - Unterstützung für verschlüsselte Inhalte
 */
import mongoose from 'mongoose';
import Poem from '../models/Poem.js';
class SyncController {
    /**
     * Hauptsynchronisationsmethode
     * Verarbeitet Client-Änderungen und sendet Server-Updates
     */
    /**
   * syncAll
   * - Endpunkt: POST /api/sync
   * - Erwartet im Body: { clientChanges: SyncPoemPayload[], since?: string }
   * - Ablauf:
   *   1. Verifizieren: req.user vorhanden
   *   2. Start einer MongoDB-Transaction (wenn DB das unterstützt)
   *   3. Für jedes clientChange:
   *      a) Wenn deleted=true -> lösche (soft oder hard) das server-Objekt falls vorhanden
   *      b) Wenn id vorhanden -> versuche zu updaten, prüfe updatedAt/version für Konflikte
   *      c) Wenn kein id aber clientId vorhanden -> erstelle neues Server-Dokument und antworte mit neuem id
   *   4. Nach Anwenden aller Änderungen -> Query: alle Server-Changes seit `since` zurückliefern
   *   5. Commit Transaction und Rückgabe
   *
   * Wichtige Hinweise zur Konflikt-Strategie:
   * - "Last-writer-wins" ist pragmatisch und einfach: vergleiche updatedAt (ISO).
   * - Zusätzlich prüfe version; falls client.version < server.version & client.updatedAt <= server.updatedAt
   *   -> Konflikt melden (server behält ursprüngliche Daten).
   */
    async synchronize(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('Nicht authentifiziert');
            }
            // Ergebnis-Container
            const clientChanges = req.body.changes || [];
            const lastSync = new Date(req.body.lastSync || 0);
            // Container für die Sync-Antwort
            const response = {
                success: true,
                changes: {
                    applied: [],
                    rejected: [],
                    serverChanges: []
                },
                timestamp: new Date()
            };
            // 1. Client-Änderungen verarbeiten
            // MongoDB Transaktion verwenden, sofern möglich
            for (const change of clientChanges) {
                try {
                    // Fall A: client signalisiert Löschung
                    if (change.deleted) {
                        // Versuche, das Dokument zu finden und zu löschen (nur wenn es dem User gehört)
                        await this.handleDeletion(change, userId, session);
                        response.changes.applied.push(change);
                    }
                    else if (change.id) {
                        // Existierendes Gedicht aktualisieren
                        const updated = await this.handleUpdate(change, userId, session);
                        if (updated) {
                            response.changes.applied.push(change);
                        }
                        else {
                            response.changes.rejected.push(change);
                        }
                    }
                    else {
                        // Neues Gedicht erstellen
                        await this.handleCreation(change, userId, session);
                        response.changes.applied.push(change);
                    }
                }
                catch (error) {
                    console.error(`Fehler bei Änderung ${change.clientId}:`, error);
                    response.changes.rejected.push(change);
                }
            }
            // 2. Server-Änderungen seit letzter Synchronisation abrufen
            const serverChanges = await Poem.find({
                authorId: userId,
                updatedAt: { $gt: lastSync }
            }).session(session);
            response.changes.serverChanges = serverChanges;
            // Transaktion abschließen
            await session.commitTransaction();
            res.json(response);
        }
        catch (error) {
            await session.abortTransaction();
            console.error('Sync-Fehler:', error);
            res.status(500).json({
                success: false,
                error: 'Synchronisationsfehler'
            });
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Verarbeitet das Löschen eines Gedichts
     */
    async handleDeletion(change, userId, session) {
        if (!change.id)
            return;
        await Poem.findOneAndDelete({
            _id: change.id,
            authorId: userId
        }).session(session);
    }
    /**
     * Verarbeitet das Aktualisieren eines Gedichts
     * Gibt true zurück, wenn erfolgreich, false bei Konflikt
     */
    async handleUpdate(change, userId, session) {
        const existing = await Poem.findOne({
            _id: change.id,
            authorId: userId
        }).session(session);
        if (!existing) {
            throw new Error('Gedicht nicht gefunden');
        }
        // Konfliktprüfung
        if (existing.version > change.version) {
            return false;
        }
        // Update durchführen
        await Poem.findByIdAndUpdate(change.id, {
            title: change.title,
            content: change.content,
            isEncrypted: change.isEncrypted,
            encryptedKey: change.encryptedKey,
            version: change.version + 1,
            updatedAt: new Date()
        }).session(session);
        return true;
    }
    /**
     * Verarbeitet das Erstellen eines neuen Gedichts
     */
    async handleCreation(change, userId, session) {
        const newPoem = new Poem({
            title: change.title,
            content: change.content,
            authorId: userId,
            isEncrypted: change.isEncrypted,
            encryptedKey: change.encryptedKey,
            version: 1,
            clientId: change.clientId // Für Referenzverfolgung
        });
        return await newPoem.save({ session });
    }
    /**
     * Hilfsmethode zum Abrufen des Synchronisationsstatus
     */
    async getSyncStatus(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('Nicht authentifiziert');
            }
            const lastChange = await Poem.findOne({ authorId: userId })
                .sort({ updatedAt: -1 })
                .select('updatedAt');
            res.json({
                success: true,
                lastSync: lastChange?.updatedAt || new Date(0),
                serverTime: new Date()
            });
        }
        catch (error) {
            console.error('Status-Fehler:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Abrufen des Sync-Status'
            });
        }
    }
}
export default new SyncController();
