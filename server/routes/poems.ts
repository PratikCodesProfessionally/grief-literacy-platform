/**
 * @fileoverview Router für Gedicht-bezogene Endpunkte
 * 
 * Implementiert RESTful Endpoints für:
 * - CRUD-Operationen für Gedichte
 * - Suche und Filterung
 * - Versionierung
 * - Verschlüsselte Speicherung
 */

import express from 'express';
import { auth } from '../middleware/auth';
import { encryptRequest, decryptResponse } from '../middleware/encryption';
import poemController from '../controllers/poemController';

const router = express.Router();

/**
 * GET /api/poems
 * Liste aller Gedichte des authentifizierten Benutzers
 * 
 * Query-Parameter:
 * - search: Suchbegriff
 * - tags: Komma-getrennte Tags
 * - page: Seitennummer (Default: 1)
 * - limit: Einträge pro Seite (Default: 10)
 */
router.get('/',
  auth.verified,
  decryptResponse,
  poemController.listPoems
);

/**
 * POST /api/poems
 * Erstellt ein neues Gedicht
 * 
 * Body:
 * - title: Titel des Gedichts
 * - content: Inhalt des Gedichts
 * - isPrivate: Sichtbarkeit (optional)
 * - tags: Array von Tags (optional)
 * - encrypt: Boolean für Verschlüsselung (optional)
 */
router.post('/',
  auth.verified,
  encryptRequest,
  decryptResponse,
  poemController.createPoem
);

/**
 * GET /api/poems/:id
 * Ruft ein spezifisches Gedicht ab
 */
router.get('/:id',
  auth.verified,
  decryptResponse,
  poemController.getPoem
);

/**
 * PUT /api/poems/:id
 * Aktualisiert ein bestehendes Gedicht
 */
router.put('/:id',
  auth.verified,
  encryptRequest,
  decryptResponse,
  poemController.updatePoem
);

/**
 * DELETE /api/poems/:id
 * Löscht ein Gedicht (Soft-Delete)
 */
router.delete('/:id',
  auth.verified,
  poemController.deletePoem
);

/**
 * GET /api/poems/:id/versions
 * Listet alle Versionen eines Gedichts
 */
router.get('/:id/versions',
  auth.verified,
  poemController.getPoemVersions
);

/**
 * POST /api/poems/:id/restore/:version
 * Stellt eine spezifische Version wieder her
 */
router.post('/:id/restore/:version',
  auth.verified,
  poemController.restoreVersion
);

/**
 * GET /api/poems/search
 * Erweiterte Suchfunktion für Gedichte
 */
router.get('/search',
  auth.verified,
  poemController.searchPoems
);

/**
 * POST /api/poems/:id/share
 * Teilt ein Gedicht mit anderen Benutzern
 */
router.post('/:id/share',
  auth.verified,
  poemController.sharePoem
);

export default router;

/**
 * Erklärung der Routen-Struktur:
1. Basis-CRUD-Operationen
GET /: Liste aller Gedichte
POST /: Neues Gedicht erstellen
GET /:id: Einzelnes Gedicht abrufen
PUT /:id: Gedicht aktualisieren
DELETE /:id: Gedicht löschen
2. Erweiterte Funktionen
Versionierung (/versions, /restore)
Suche (/search)
Teilen (/share)
3. Middleware-Integration
Authentifizierung (auth.verified)
Verschlüsselung (encryptRequest/decryptResponse)
4. Beispiel für eine API-Anfrage:
# Neues Gedicht erstellen
curl -X POST http://localhost:3000/api/poems \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mein Gedicht",
    "content": "Gedichttext...",
    "isPrivate": true,
    "tags": ["trauer", "hoffnung"],
    "encrypt": true
  }'
  */