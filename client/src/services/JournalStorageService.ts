/**
 * Journal Storage Service
 * Implements dual storage architecture: Local (IndexedDB) + Cloud (API)
 */

export type StorageType = 'local' | 'cloud' | 'hybrid';

export interface JournalEntry {
  id: string;
  date: string;
  timestamp: number;
  content: string;
  prompt?: string;
  promptCategory?: string;
  mood?: 'positive' | 'neutral' | 'difficult';
  tags?: string[];
  wordCount: number;
  charCount: number;
  isLocked?: boolean;
  isFavorite?: boolean;
  photos?: string[];
  audioUrl?: string;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict' | 'local-only';
}

export interface StorageSettings {
  storageType: StorageType;
  encryptionEnabled: boolean;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

class JournalStorageService {
  private dbName = 'GriefJournalDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private storageSettings: StorageSettings;

  constructor() {
    this.storageSettings = this.loadSettings();
    this.initDB();
  }

  private loadSettings(): StorageSettings {
    const saved = localStorage.getItem('journal-storage-settings');
    return saved ? JSON.parse(saved) : {
      storageType: 'local',
      encryptionEnabled: false,
      autoBackup: true,
      backupFrequency: 'weekly'
    };
  }

  private saveSettings(settings: StorageSettings) {
    this.storageSettings = settings;
    localStorage.setItem('journal-storage-settings', JSON.stringify(settings));
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('mood', 'mood', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }

  async saveEntry(entry: JournalEntry): Promise<void> {
    if (!this.db) await this.initDB();

    entry.lastModified = Date.now();
    entry.syncStatus = this.storageSettings.storageType === 'local' ? 'local-only' : 'pending';

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.put(entry);

      request.onsuccess = () => {
        if (this.storageSettings.storageType !== 'local') {
          this.syncToCloud(entry);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getEntry(id: string): Promise<JournalEntry | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEntries(): Promise<JournalEntry[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEntry(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.delete(id);

      request.onsuccess = () => {
        if (this.storageSettings.storageType !== 'local') {
          this.deleteFromCloud(id);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async searchEntries(query: string): Promise<JournalEntry[]> {
    const allEntries = await this.getAllEntries();
    const lowerQuery = query.toLowerCase();
    
    return allEntries.filter(entry => 
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.prompt?.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async filterByMood(mood: string): Promise<JournalEntry[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const index = store.index('mood');
      const request = index.getAll(mood);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async filterByDateRange(startDate: number, endDate: number): Promise<JournalEntry[]> {
    const allEntries = await this.getAllEntries();
    return allEntries.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );
  }

  async exportEntries(format: 'json' | 'txt' | 'csv'): Promise<string> {
    const entries = await this.getAllEntries();
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
      
      case 'txt':
        return entries.map(entry => 
          `Date: ${entry.date}\n` +
          `${entry.prompt ? `Prompt: ${entry.prompt}\n` : ''}` +
          `${entry.mood ? `Mood: ${entry.mood}\n` : ''}` +
          `${entry.tags?.length ? `Tags: ${entry.tags.join(', ')}\n` : ''}` +
          `\n${entry.content}\n\n` +
          `---\n\n`
        ).join('');
      
      case 'csv':
        const headers = 'Date,Prompt,Mood,Tags,Word Count,Content\n';
        const rows = entries.map(entry =>
          `"${entry.date}","${entry.prompt || ''}","${entry.mood || ''}","${entry.tags?.join(';') || ''}",${entry.wordCount},"${entry.content.replace(/"/g, '""')}"`
        ).join('\n');
        return headers + rows;
      
      default:
        return '';
    }
  }

  async importEntries(data: string, format: 'json'): Promise<number> {
    let entries: JournalEntry[] = [];
    
    if (format === 'json') {
      try {
        entries = JSON.parse(data);
      } catch (e) {
        throw new Error('Invalid JSON format');
      }
    }

    let importedCount = 0;
    for (const entry of entries) {
      await this.saveEntry(entry);
      importedCount++;
    }

    return importedCount;
  }

  async getStorageStats(): Promise<{ entryCount: number; totalWords: number; totalSize: number }> {
    const entries = await this.getAllEntries();
    const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
    const totalSize = new Blob([JSON.stringify(entries)]).size;

    return {
      entryCount: entries.length,
      totalWords,
      totalSize
    };
  }

  async migrateStorage(newType: StorageType): Promise<void> {
    const entries = await this.getAllEntries();
    
    this.storageSettings.storageType = newType;
    this.saveSettings(this.storageSettings);

    if (newType === 'cloud' || newType === 'hybrid') {
      for (const entry of entries) {
        await this.syncToCloud(entry);
      }
    }
  }

  private async syncToCloud(entry: JournalEntry): Promise<void> {
    // Placeholder for cloud sync implementation
    // In production, this would call your API
    console.log('Syncing to cloud:', entry.id);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        entry.syncStatus = 'synced';
        resolve();
      }, 1000);
    });
  }

  private async deleteFromCloud(id: string): Promise<void> {
    // Placeholder for cloud deletion
    console.log('Deleting from cloud:', id);
  }

  getSettings(): StorageSettings {
    return { ...this.storageSettings };
  }

  updateSettings(settings: Partial<StorageSettings>): void {
    this.saveSettings({ ...this.storageSettings, ...settings });
  }
}

export const journalStorage = new JournalStorageService();
