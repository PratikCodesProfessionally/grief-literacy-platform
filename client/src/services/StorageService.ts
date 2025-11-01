/**
 * @fileoverview Storage Service für die Poetry-Therapy-Plattform
 * 
 * Dieser Service implementiert ein flexibles Speichersystem mit:
 * - Lokalem Storage (Browser)
 * - Cloud Storage (Remote API)
 * - Abstraktem Provider-Interface
 * - Factory Pattern für Provider-Erstellung
 */

/**
 * Basis-Interface für alle speicherbaren Elemente
 * @interface StorageItem
 * @description Definiert die Mindestanforderungen für speicherbare Objekte
 */
export interface StorageItem {
  id: string;        // Eindeutige ID
  createdAt: Date;   // Erstellungszeitpunkt
  updatedAt: Date;   // Letzter Änderungszeitpunkt
}

/**
 * Spezifisches Interface für Gedichte
 * @interface Poem
 * @extends StorageItem
 */
export interface Poem extends StorageItem {
  title: string;     // Titel des Gedichts
  content: string;   // Gedichttext
  authorId: string;  // Referenz zum Autor
  isPrivate: boolean;// Sichtbarkeitseinstellung
  tags?: string[];   // Optionale Kategorisierung
}

/**
 * Spezifisches Interface für Geschichten
 * @interface Story
 * @extends StorageItem
 */
export interface Story extends StorageItem {
  prompt: string;    // Story-Prompt
  content: string;   // Geschichte-Inhalt
  wordCount: number; // Wortzahl
  timeSpent: number; // Schreibzeit in Sekunden
  savedAt: string;   // Speicherdatum
  category: string;  // Kategorie (z.B. Comfort, Connection, etc.)
}

/**
 * Provider-Interface für Speicheroperationen
 * @interface IStorageProvider
 * @description Definiert CRUD-Operationen für Storage-Provider
 */
export interface IStorageProvider {
  save<T extends StorageItem>(item: T): Promise<T>;
  get<T extends StorageItem>(id: string): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  list<T extends StorageItem>(): Promise<T[]>;
  update<T extends StorageItem>(id: string, item: Partial<T>): Promise<T>;
}

/**
 * Abstrakte Basisklasse für Storage-Provider
 * @abstract
 * @class BaseStorageProvider
 * @implements {IStorageProvider}
 */
abstract class BaseStorageProvider implements IStorageProvider {
  protected constructor(protected readonly namespace: string) {}

  abstract save<T extends StorageItem>(item: T): Promise<T>;
  abstract get<T extends StorageItem>(id: string): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract list<T extends StorageItem>(): Promise<T[]>;
  abstract update<T extends StorageItem>(id: string, item: Partial<T>): Promise<T>;

  /**
   * Generiert eine eindeutige ID
   * @protected
   * @returns {string} Eindeutige ID
   */
  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

/**
 * Implementierung für lokale Speicherung
 * @class LocalStorageProvider
 * @extends {BaseStorageProvider}
 */
class LocalStorageProvider extends BaseStorageProvider {
  constructor(namespace: string) {
    super(namespace);
  }

  /**
   * Speichert ein Item lokal
   * @template T
   * @param {T} item - Zu speicherndes Item
   * @returns {Promise<T>} Gespeichertes Item mit ID
   */
  async save<T extends StorageItem>(item: T): Promise<T> {
    try {
      const id = this.generateId();
      const timestamp = new Date();
      const newItem = {
        ...item,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as T;

      const items = await this.getStoredItems<T>();
      items.push(newItem);
      localStorage.setItem(this.namespace, JSON.stringify(items));

      return newItem;
    } catch (error) {
      console.error('LocalStorage save error:', error);
      throw new Error('Failed to save item to local storage');
    }
  }

  /**
   * Liest ein Item aus dem Storage
   * @template T
   * @param {string} id - Item ID
   * @returns {Promise<T | null>} Gefundenes Item oder null
   */
  async get<T extends StorageItem>(id: string): Promise<T | null> {
    try {
      const items = await this.getStoredItems<T>();
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      throw new Error('Failed to retrieve item from local storage');
    }
  }

  /**
   * Löscht ein Item aus dem Storage
   * @param {string} id - Zu löschende Item ID
   * @returns {Promise<boolean>} Erfolg der Operation
   */
  async delete(id: string): Promise<boolean> {
    try {
      const items = await this.getStoredItems();
      const filteredItems = items.filter(item => item.id !== id);
      localStorage.setItem(this.namespace, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('LocalStorage delete error:', error);
      throw new Error('Failed to delete item from local storage');
    }
  }

  /**
   * Listet alle Items im Storage
   * @template T
   * @returns {Promise<T[]>} Array aller Items
   */
  async list<T extends StorageItem>(): Promise<T[]> {
    try {
      return await this.getStoredItems<T>();
    } catch (error) {
      console.error('LocalStorage list error:', error);
      throw new Error('Failed to list items from local storage');
    }
  }

  /**
   * Aktualisiert ein Item
   * @template T
   * @param {string} id - Item ID
   * @param {Partial<T>} updates - Zu aktualisierende Felder
   * @returns {Promise<T>} Aktualisiertes Item
   */
  async update<T extends StorageItem>(id: string, updates: Partial<T>): Promise<T> {
    try {
      const items = await this.getStoredItems<T>();
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      const updatedItem = {
        ...items[itemIndex],
        ...updates,
        updatedAt: new Date(),
      } as T;

      items[itemIndex] = updatedItem;
      localStorage.setItem(this.namespace, JSON.stringify(items));

      return updatedItem;
    } catch (error) {
      console.error('LocalStorage update error:', error);
      throw new Error('Failed to update item in local storage');
    }
  }

  /**
   * Interne Methode zum Laden aller Items
   * @private
   * @template T
   * @returns {Promise<T[]>} Array aller Items
   */
  private async getStoredItems<T extends StorageItem>(): Promise<T[]> {
    const data = localStorage.getItem(this.namespace);
    return data ? JSON.parse(data) : [];
  }
}

/**
 * Implementierung für Cloud-Speicherung
 * @class CloudStorageProvider
 * @extends {BaseStorageProvider}
 */
class CloudStorageProvider extends BaseStorageProvider {
  private apiUrl: string;

  constructor(namespace: string, apiUrl: string) {
    super(namespace);
    this.apiUrl = apiUrl;
  }

  /**
   * Speichert ein Item in der Cloud
   * @template T
   * @param {T} item - Zu speicherndes Item
   * @returns {Promise<T>} Gespeichertes Item
   */
  async save<T extends StorageItem>(item: T): Promise<T> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.namespace}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('Cloud storage save error:', error);
      throw new Error('Failed to save item to cloud storage');
    }
  }

  async get<T extends StorageItem>(id: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.namespace}/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('Cloud storage get error:', error);
      throw new Error('Failed to retrieve item from cloud storage');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.namespace}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Cloud storage delete error:', error);
      throw new Error('Failed to delete item from cloud storage');
    }
  }

  async list<T extends StorageItem>(): Promise<T[]> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.namespace}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('Cloud storage list error:', error);
      throw new Error('Failed to list items from cloud storage');
    }
  }

  async update<T extends StorageItem>(id: string, updates: Partial<T>): Promise<T> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.namespace}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('Cloud storage update error:', error);
      throw new Error('Failed to update item in cloud storage');
    }
  }

  /**
   * Holt den Auth-Token für API-Requests
   * @private
   * @returns {string} Auth-Token
   */
  private getAuthToken(): string {
    // TODO: Integration mit AuthService
    return 'your-auth-token';
  }
}

/**
 * Factory für Storage-Provider
 * @class StorageProviderFactory
 */
export class StorageProviderFactory {
  /**
   * Erstellt einen Storage-Provider
   * @static
   * @param {'local' | 'cloud'} type - Provider-Typ
   * @param {string} namespace - Namespace für Datentrennung
   * @param {string} [apiUrl] - API-URL für Cloud-Storage
   * @returns {IStorageProvider} Storage-Provider-Instanz
   */
  static createProvider(type: 'local' | 'cloud', namespace: string, apiUrl?: string): IStorageProvider {
    switch (type) {
      case 'local':
        return new LocalStorageProvider(namespace);
      case 'cloud':
        if (!apiUrl) {
          throw new Error('API URL is required for cloud storage');
        }
        return new CloudStorageProvider(namespace, apiUrl);
      default:
        throw new Error('Invalid storage provider type');
    }
  }
}

/**
 * @example Verwendungsbeispiel:
 * 
 * // Provider erstellen
 * const localProvider = StorageProviderFactory.createProvider('local', 'poems');
 * 
 * // Gedicht speichern
 * const poem: Poem = {
 *   title: "Mein Gedicht",
 *   content: "Inhalt...",
 *   authorId: "user123",
 *   isPrivate: true
 * };
 * 
 * await localProvider.save(poem);
 */
