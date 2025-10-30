/**
 * @fileoverview Router für Synchronisations-Endpunkte
 * 
 * Implementiert Endpoints für:
 * - Zwei-Wege-Synchronisation zwischen Client und Server
 * - Konfliktbehandlung
 * - Versionskontrolle
 * - Verschlüsselte Übertragung
 */

import express from 'express';
import { auth } from '../middleware/auth';
import { encryptRequest, decryptResponse } from '../middleware/encryption';
import syncController from '../controllers/syncController';

const router = express.Router();

/**
 * POST /api/sync
 * Hauptsynchronisations-Endpoint
 * 
 * Body:
 * - changes: Array von Client-Änderungen
 * - lastSync: Timestamp der letzten Synchronisation
 * 
 * Response:
 * - applied: Erfolgreich angewendete Änderungen
 * - rejected: Abgelehnte Änderungen (Konflikte)
 * - serverChanges: Neue Server-Änderungen
 */
router.post('/',
  auth.verified,
  encryptRequest,
  decryptResponse,
  syncController.synchronize
);

/**
 * GET /api/sync/status
 * Liefert Synchronisationsstatus
 * 
 * Response:
 * - lastSync: Zeitstempel der letzten Synchronisation
 * - pendingChanges: Anzahl ausstehender Änderungen
 */
router.get('/status',
  auth.verified,
  syncController.getSyncStatus
);

/**
 * GET /api/sync/changes
 * Ruft nur Server-Änderungen ab
 * 
 * Query:
 * - since: Timestamp für inkrementelle Synchronisation
 */
router.get('/changes',
  auth.verified,
  decryptResponse,
  syncController.getServerChanges
);

/**
 * POST /api/sync/resolve
 * Löst Synchronisationskonflikte auf
 * 
 * Body:
 * - conflicts: Array von aufgelösten Konflikten
 * - resolution: Gewählte Auflösungsstrategie
 */
router.post('/resolve',
  auth.verified,
  encryptRequest,
  decryptResponse,
  syncController.resolveConflicts
);

/**
 * POST /api/sync/reset
 * Setzt Synchronisationsstatus zurück
 * 
 * Body:
 * - force: Boolean für erzwungenen Reset
 */
router.post('/reset',
  auth.verified,
  syncController.resetSync
);

/**
 * GET /api/sync/conflicts
 * Listet aktuelle Synchronisationskonflikte
 */
router.get('/conflicts',
  auth.verified,
  syncController.listConflicts
);

/**
 * POST /api/sync/backup
 * Erstellt eine Sicherung vor großen Synchronisationen
 */
router.post('/backup',
  auth.verified,
  syncController.createBackup
);

/**
 * POST /api/sync/restore
 * Stellt eine Sicherung wieder her
 * 
 * Body:
 * - backupId: ID der wiederherzustellenden Sicherung
 */
router.post('/restore',
  auth.verified,
  syncController.restoreBackup
);

export default router;

/**
 * 1. Hauptsynchronisation
POST /api/sync: Zentrale Synchronisationslogik
Verarbeitet Client-Änderungen
Liefert Server-Änderungen
Handhabt Konflikte
2. Status und Monitoring
GET /sync/status: Synchronisationsstatus
GET /sync/conflicts: Aktuelle Konflikte
GET /sync/changes: Inkrementelle Updates
3. Konfliktmanagement
POST /sync/resolve: Konfliktauflösung
Verschiedene Auflösungsstrategien
Manuelle Konfliktbehandlung
4. Sicherheit und Wiederherstellung
POST /sync/backup: Datensicherung
POST /sync/restore: Wiederherstellung
POST /sync/reset: Zurücksetzen
5. Beispielverwendung:

# Synchronisation starten
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": [],
    "lastSync": "2025-10-29T12:00:00Z"
  }'

# Status abrufen
curl -X GET http://localhost:3000/api/sync/status \
  -H "Authorization: Bearer <token>"
  */