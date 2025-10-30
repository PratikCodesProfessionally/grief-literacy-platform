import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Poem, { IPoem } from '../models/Poem';
import { logger } from '../utils/logger';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user: { id: string };
      isEncrypted?: boolean;
      encryptedContent?: string;
      encryptedKey?: string;
    }
  }
}

/**
 * Controller-Klasse für Gedicht-Operationen
 * Implementiert CRUD + erweiterte Funktionen
 */
class PoemController {
  /**
   * Erstellt ein neues Gedicht
   * @param req Express Request
   * @param res Express Response
   */
  public async createPoem(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, isPrivate, tags, prompt } = req.body;
      const authorId = req.user.id; // Kommt aus Auth-Middleware

      // Erweiterte Validierung
      if (!this.validatePoemInput(title, content)) {
        res.status(400).json({
          success: false,
          error: 'Ungültige Eingabedaten'
        });
        return;
      }

      // Neues Gedicht erstellen
      const poem = new Poem({
        title,
        content: req.isEncrypted ? req.encryptedContent : content,
        authorId,
        isEncrypted: req.isEncrypted || false,
        encryptedKey: req.encryptedKey,
        isPrivate: isPrivate ?? true,
        tags: tags || [],
        prompt,
        version: 1
      });

      const savedPoem = await poem.save();
      
      // Erfolgsantwort
      res.status(201).json({
        success: true,
        data: savedPoem
      });
    } catch (error) {
      logger.error('Fehler beim Erstellen des Gedichts:', error);
      this.handleError(res, error);
    }
  }

  /**
   * Lädt ein spezifisches Gedicht
   * @param req Express Request
   * @param res Express Response
   */
  public async getPoem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validiere ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Ungültige Gedicht-ID'
        });
        return;
      }

      // Finde Gedicht mit Zugriffsprüfung
      const poem = await Poem.findOne({
        _id: id,
        $or: [
          { authorId: userId },
          { isPrivate: false }
        ]
      });

      if (!poem) {
        res.status(404).json({
          success: false,
          error: 'Gedicht nicht gefunden'
        });
        return;
      }

      res.json({
        success: true,
        data: poem
      });
    } catch (error) {
      logger.error('Fehler beim Laden des Gedichts:', error);
      res.status(500).json({
        success: false,
        error: 'Interner Serverfehler beim Laden des Gedichts'
      });
    }
  }

  /**
   * Listet alle Gedichte eines Benutzers
   * @param req Express Request
   * @param res Express Response
   */
  public async listPoems(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 10, 
        tags, 
        search,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query as { 
        page?: number, 
        limit?: number, 
        tags?: string, 
        search?: string,
        sortBy?: string,
        order?: string 
      };

      const filter = this.buildPoemFilters(
        userId,
        tags as string,
        search as string
      );

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      // Gedichte laden
      const poems = await Poem.find(filter)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(Number(limit));

      // Gesamtzahl für Pagination
      const total = await Poem.countDocuments(filter);

      res.json({
        success: true,
        data: poems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Fehler beim Auflisten der Gedichte:', error);
      this.handleError(res, error);
    }
  }

  /**
   * Aktualisiert ein Gedicht
   * @param req Express Request
   * @param res Express Response
   */
  public async updatePoem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Validiere ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Ungültige Gedicht-ID'
        });
        return;
      }

      // Finde und aktualisiere Gedicht
      const poem = await Poem.findOne({
        _id: id,
        authorId: userId
      });

      if (!poem) {
        res.status(404).json({
          success: false,
          error: 'Gedicht nicht gefunden'
        });
        return;
      }

      // Version erhöhen
      updates.version = poem.version + 1;
      
      // Wenn verschlüsselt, Content aktualisieren
      if (req.isEncrypted) {
        updates.content = req.encryptedContent;
        updates.encryptedKey = req.encryptedKey;
        updates.isEncrypted = true;
      }

      // Gedicht aktualisieren
      const updatedPoem = await Poem.findByIdAndUpdate(
        id,
        { 
          ...updates,
          updatedAt: new Date()
        },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedPoem
      });
    } catch (error) {
      logger.error('Fehler beim Aktualisieren des Gedichts:', error);
      res.status(500).json({
        success: false,
        error: 'Interner Serverfehler beim Aktualisieren des Gedichts'
      });
    }
  }

  /**
   * Löscht ein Gedicht
   * @param req Express Request
   * @param res Express Response
   */
  public async deletePoem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validiere ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Ungültige Gedicht-ID'
        });
        return;
      }

      // Finde und lösche Gedicht
      const poem = await Poem.findOneAndDelete({
        _id: id,
        authorId: userId
      });

      if (!poem) {
        res.status(404).json({
          success: false,
          error: 'Gedicht nicht gefunden'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Gedicht erfolgreich gelöscht'
      });
    } catch (error) {
      logger.error('Fehler beim Löschen des Gedichts:', error);
      res.status(500).json({
        success: false,
        error: 'Interner Serverfehler beim Löschen des Gedichts'
      });
    }
  }

  // Hilfsmethoden
  private validatePoemInput(title?: string, content?: string): boolean {
    return Boolean(
      title?.trim() &&
      content?.trim() &&
      title.length <= 200 &&
      content.length <= 10000
    );
  }

  private handleError(res: Response, error: any): void {
    const statusCode = error instanceof mongoose.Error ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Interner Serverfehler';
    
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  private buildPoemFilters(userId: string, tags?: string, search?: string): any {
    const filters: any = { authorId: userId };

    if (tags) {
      filters.tags = { $all: tags.split(',').map(tag => tag.trim()) };
    }

    if (search) {
      const searchRegex = { $regex: new RegExp(search, 'i') };
      filters.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    return filters;
  }
}

// Controller-Instanz exportieren
export default new PoemController();