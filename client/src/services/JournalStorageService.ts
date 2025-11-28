/**
 * Journal Storage Service
 * Implements dual storage architecture: Local (IndexedDB) + Cloud (Supabase)
 * Offline-first with background sync and encryption
 */

import { supabase } from '../lib/supabase';
import { EncryptionService } from './EncryptionService';
import { SyncService } from './SyncService';

export type StorageType = 'local' | 'cloud' | 'hybrid';

export interface JournalEntry {
  id: string;
  content: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  mood?: string;
  tags?: string[];
  version?: number;
  syncStatus?: 'synced' | 'pending' | 'conflict' | 'local-only';
  
  // Legacy fields for backward compatibility
  date?: string;
  timestamp?: number;
  prompt?: string;
  promptCategory?: string;
  wordCount?: number;
  charCount?: number;
  isLocked?: boolean;
  isFavorite?: boolean;
  photos?: string[];
  audioUrl?: string;
  lastModified?: number;
}

export interface StorageSettings {
  storageType: StorageType;
  encryptionEnabled: boolean;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptionPassword?: string; // Stored in memory only during session
  userId?: string;
}

class JournalStorageService {
  private dbName = 'GriefJournalDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private storageSettings: StorageSettings;

  constructor() {
    this.storageSettings = this.loadSettings();
    this.initDB();
    SyncService.init().catch(console.error);
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

    // Ensure required fields
    if (!entry.id) entry.id = crypto.randomUUID();
    if (!entry.createdAt) entry.createdAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    entry.version = (entry.version || 0) + 1;
    
    // Legacy fields for backward compatibility
    entry.lastModified = Date.now();
    entry.timestamp = Date.now();
    entry.date = new Date().toISOString().split('T')[0];
    entry.wordCount = entry.content.split(/\s+/).filter(w => w.length > 0).length;
    entry.charCount = entry.content.length;
    
    entry.syncStatus = this.storageSettings.storageType === 'local' ? 'local-only' : 'pending';

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.put(entry);

      request.onsuccess = async () => {
        if (this.storageSettings.storageType !== 'local') {
          await this.syncToCloud(entry);
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
      console.log(`Migrating ${entries.length} entries to cloud...`);
      for (const entry of entries) {
        await this.syncToCloud(entry);
      }
      console.log('Migration complete');
    }
  }

  /**
   * Download entries from cloud and merge with local
   */
  async syncFromCloud(): Promise<number> {
    if (!this.storageSettings.userId || !this.storageSettings.encryptionPassword) {
      console.warn('Cannot sync from cloud: missing user ID or encryption password');
      return 0;
    }

    try {
      const lastSyncAt = this.getLastSyncTime();
      const cloudEntries = await SyncService.downloadFromCloud(
        this.storageSettings.userId,
        this.storageSettings.encryptionPassword,
        lastSyncAt
      );

      let mergedCount = 0;
      for (const cloudEntry of cloudEntries) {
        const localEntry = await this.getEntry(cloudEntry.id);

        if (!localEntry) {
          // New entry from cloud - save to local
          await this.saveEntry({ ...cloudEntry, syncStatus: 'synced' });
          mergedCount++;
        } else if (localEntry.version! < cloudEntry.version!) {
          // Cloud version is newer - update local
          await this.saveEntry({ ...cloudEntry, syncStatus: 'synced' });
          mergedCount++;
        } else if (localEntry.version! > cloudEntry.version!) {
          // Local version is newer - sync to cloud
          await this.syncToCloud(localEntry);
        }
      }

      this.setLastSyncTime(new Date());
      return mergedCount;
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      return 0;
    }
  }

  /**
   * Set user context for cloud sync
   */
  setUserContext(userId: string, encryptionPassword: string): void {
    this.storageSettings.userId = userId;
    this.storageSettings.encryptionPassword = encryptionPassword;
    
    // Store in sessionStorage (cleared on browser close)
    sessionStorage.setItem('grief-platform-user-id', userId);
    sessionStorage.setItem('grief-platform-encryption-password', encryptionPassword);
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    this.storageSettings.userId = undefined;
    this.storageSettings.encryptionPassword = undefined;
    
    sessionStorage.removeItem('grief-platform-user-id');
    sessionStorage.removeItem('grief-platform-encryption-password');
  }

  /**
   * Get last sync time
   */
  private getLastSyncTime(): Date | null {
    const lastSync = localStorage.getItem('journal-last-sync');
    return lastSync ? new Date(lastSync) : null;
  }

  /**
   * Set last sync time
   */
  private setLastSyncTime(date: Date): void {
    localStorage.setItem('journal-last-sync', date.toISOString());
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    return await SyncService.getSyncStatus();
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<void> {
    if (!this.storageSettings.userId || !this.storageSettings.encryptionPassword) {
      throw new Error('Cannot force sync: missing user credentials');
    }

    await SyncService.forceSync(
      this.storageSettings.userId,
      this.storageSettings.encryptionPassword
    );
  }

  private async syncToCloud(entry: JournalEntry): Promise<void> {
    try {
      const userId = this.storageSettings.userId;
      const encryptionPassword = this.storageSettings.encryptionPassword;

      if (!userId) {
        console.warn('No user ID - skipping cloud sync');
        return;
      }

      // Add to sync queue for background processing
      await SyncService.addToQueue(entry.id, 'update', entry);

      // If online and encryption password available, try immediate sync
      if (navigator.onLine && encryptionPassword) {
        const deviceId = EncryptionService.generateDeviceId();
        const encryptedContent = await EncryptionService.encrypt(entry.content, encryptionPassword);
        const encryptedTitle = entry.title
          ? await EncryptionService.encrypt(entry.title, encryptionPassword)
          : null;

        const cloudData = {
          id: entry.id,
          user_id: userId,
          encrypted_content: encryptedContent.ciphertext,
          encrypted_title: encryptedTitle?.ciphertext || null,
          encryption_iv: encryptedContent.iv,
          encryption_salt: encryptedContent.salt,
          mood: entry.mood || null,
          tags: entry.tags || [],
          created_at: entry.createdAt,
          updated_at: entry.updatedAt || new Date().toISOString(),
          version: entry.version || 1,
          device_id: deviceId,
          sync_status: 'synced' as const,
        };

        const { error } = await supabase.from('journal_entries').upsert(cloudData);

        if (error) {
          console.error('Sync error:', error);
          entry.syncStatus = 'pending';
        } else {
          entry.syncStatus = 'synced';
          // Update local entry with synced status
          await this.updateEntryStatus(entry.id, 'synced');
        }
      }
    } catch (error) {
      console.error('Cloud sync failed:', error);
      entry.syncStatus = 'pending';
    }
  }

  private async deleteFromCloud(id: string): Promise<void> {
    try {
      const userId = this.storageSettings.userId;

      if (!userId) {
        console.warn('No user ID - skipping cloud delete');
        return;
      }

      // Add to sync queue
      const dummyEntry: JournalEntry = { id, content: '', createdAt: new Date().toISOString() };
      await SyncService.addToQueue(id, 'delete', dummyEntry);

      // If online, try immediate delete
      if (navigator.onLine) {
        const { error } = await supabase
          .from('journal_entries')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Cloud delete error:', error);
        }
      }
    } catch (error) {
      console.error('Delete from cloud failed:', error);
    }
  }

  private async updateEntryStatus(id: string, status: JournalEntry['syncStatus']): Promise<void> {
    if (!this.db) return;

    const entry = await this.getEntry(id);
    if (entry) {
      entry.syncStatus = status;
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(['entries'], 'readwrite');
        const store = transaction.objectStore('entries');
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  getSettings(): StorageSettings {
    return { ...this.storageSettings };
  }

  updateSettings(settings: Partial<StorageSettings>): void {
    this.saveSettings({ ...this.storageSettings, ...settings });
  }
}

export const journalStorage = new JournalStorageService();
