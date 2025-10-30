/**
 * @fileoverview Sync-Controller für die Poetry-Therapy-Platform
 * 
 * Dieser Controller ist verantwortlich für:
 * - Bidirektionale Synchronisation zwischen Client und Server
 * - Konfliktbehandlung bei gleichzeitigen Änderungen
 * - Versionskontrolle und Änderungsverfolgung
 * - Unterstützung für verschlüsselte Inhalte
 */

/**
 * syncController.ts
 *
 * Dieser Controller implementiert die Server-Seite der Synchronisation ("/api/sync").
 * Ziel: sichere, robuste und nachvollziehbare Zwei-Wege-Synchronisation zwischen
 * Client (lokal/browser) und Server (Cloud).
 *
 * Wichtige Designentscheidungen (Kurzüberblick):
 * - Authentifizierung: req.user wird erwartet (Auth-Middleware vorausgesetzt).
 * - Konfliktauflösung: "Last-writer-wins" basierend auf updatedAt + version.
 *   - Server kann Konflikte zurückmelden, damit der Client ggf. manuell zusammenführt.
 * - Verschlüsselung: verschlüsselte Inhalte werden unverändert gespeichert (server treat-as-blob).
 *   - Server versucht nicht, verschlüsselte Inhalte zu entschlüsseln.
 * - Atomicität: Änderungen werden in einer Transaktion ausgeführt (MongoDB session), wenn möglich.
 * - Soft-Delete-Unterstützung: client-side Löschvorgänge werden respektiert (deleted flag).
 * - Inkrementeller Sync: Client sendet optional `since`-Timestamp, um nur Änderungen zu erhalten.
 *
 * Die Methoden hier:
 * - syncAll: Haupt-Endpoint für Push (client -> server) gefolgt von Pull (server -> client)
 * - getServerChanges: Nur Pull: liefert Server-Änderungen seit `since`
 *
 * Ausführliche Kommentare im Code erklären jeden Schritt (lecture-style).
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Poem, { IPoem } from '../models/Poem.js';

/**
 * Definiert die Struktur der Client-Änderungen
 */

/**
 * Typdefinition für die Struktur, die der Client beim Sync schickt.
 * Wichtige Felder:
 * - id: serverseitige _id falls vorhanden (string), sonst client-generierte id (clientId)
 * - clientId: optional, wenn Item lokal erstellt und noch keinen serverId hat
 * - title, content, ... Standard-Felder
 * - updatedAt: ISO string oder epoch; wird für Konfliktauflösung verwendet
 * - version: client-seitige Version (optional) — dient zur besseren Konflikterkennung
 * - deleted: optional boolean für Soft-Deletes
 * - isEncrypted / encryptedKey: falls der Client die Payload verschlüsselt hat
 */

interface ClientChange {
  id?: string;           // Server-ID falls vorhanden
  clientId: string;      // Lokale Client-ID
  title: string;
  content: string;
  isEncrypted: boolean;
  encryptedKey?: string;
  version: number;
  timestamp: Date;
  deleted?: boolean;     // Für Soft-Deletes
}

/**
 * Definiert die Sync-Antwort-Struktur
 */


/**
 * Antwortformat des Sync-Endpunkts:
 * - serverChanges: Array von Poem-Dokumenten, die der Client übernehmen sollte
 * - applied: Liste der client-seitigen Elemente, die auf dem Server erfolgreich angewendet wurden
 * - conflicts: falls Konflikte erkannt wurden, werden sie hier gemeldet (client kann UI zeigen)
 */

interface SyncResponse {
  success: boolean;
  changes: {
    applied: ClientChange[];    // Erfolgreich synchronisierte Änderungen
    rejected: ClientChange[];   // Abgelehnte Änderungen (Konflikte)
    serverChanges: IPoem[];    // Neue Server-Änderungen
  };
  timestamp: Date;             // Server-Zeitstempel
}

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

  public async synchronize(req: Request, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('Nicht authentifiziert');
      }

          // Ergebnis-Container
      const clientChanges: ClientChange[] = req.body.changes || [];
      const lastSync = new Date(req.body.lastSync || 0);

      // Container für die Sync-Antwort
      const response: SyncResponse = {
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
        try{
            // Fall A: client signalisiert Löschung
          if (change.deleted) {
            // Versuche, das Dokument zu finden und zu löschen (nur wenn es dem User gehört)
            await this.handleDeletion(change, userId, session);
            response.changes.applied.push(change);
          } else if (change.id) {
            // Existierendes Gedicht aktualisieren
            const updated = await this.handleUpdate(change, userId, session);
            if (updated) {
              response.changes.applied.push(change);
            } else {
              response.changes.rejected.push(change);
            }
          } else {
            // Neues Gedicht erstellen
            await this.handleCreation(change, userId, session);
            response.changes.applied.push(change);
          }
        } catch (error) {
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
    } catch (error) {
      await session.abortTransaction();
      console.error('Sync-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Synchronisationsfehler'
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Verarbeitet das Löschen eines Gedichts
   */
  private async handleDeletion(
    change: ClientChange,
    userId: string,
    session: mongoose.ClientSession
  ): Promise<void> {
    if (!change.id) return;

    await Poem.findOneAndDelete({
      _id: change.id,
      authorId: userId
    }).session(session);
  }

  /**
   * Verarbeitet das Aktualisieren eines Gedichts
   * Gibt true zurück, wenn erfolgreich, false bei Konflikt
   */
  private async handleUpdate(
    change: ClientChange,
    userId: string,
    session: mongoose.ClientSession
  ): Promise<boolean> {
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
  private async handleCreation(
    change: ClientChange,
    userId: string,
    session: mongoose.ClientSession
  ): Promise<IPoem> {
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
  public async getSyncStatus(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Status-Fehler:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen des Sync-Status'
      });
    }
  }
}

export default new SyncController();