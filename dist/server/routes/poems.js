// @ts-nocheck
import express from 'express';
import { auth } from '../middleware/auth.js';
import poemController from '../controllers/poemController.js';
const router = express.Router();
// GET /api/poems - Liste aller Gedichte
router.get('/', auth.verified, (req, res) => poemController.listPoems(req, res));
// POST /api/poems - Neues Gedicht erstellen
router.post('/', auth.verified, (req, res) => poemController.createPoem(req, res));
// GET /api/poems/:id - Einzelnes Gedicht abrufen
router.get('/:id', auth.verified, (req, res) => poemController.getPoem(req, res));
// PUT /api/poems/:id - Gedicht aktualisieren
router.put('/:id', auth.verified, (req, res) => poemController.updatePoem(req, res));
// DELETE /api/poems/:id - Gedicht löschen
router.delete('/:id', auth.verified, (req, res) => poemController.deletePoem(req, res));
export default router;
