// @ts-nocheck
import express from 'express';
import { auth } from '../middleware/auth.js';
import syncController from '../controllers/syncController.js';
const router = express.Router();
// POST /api/sync - Hauptsynchronisation
router.post('/', auth.verified, (req, res) => syncController.synchronize(req, res));
// GET /api/sync/status - Synchronisationsstatus
router.get('/status', auth.verified, (req, res) => syncController.getSyncStatus(req, res));
export default router;
