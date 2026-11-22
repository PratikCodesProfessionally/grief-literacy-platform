/**
 * Journal Storage Service
 * Implements dual storage architecture: Local (IndexedDB) + Cloud (Supabase)
 * Offline-first with background sync and encryption
 */

import { supabase } from '../lib/supabase';
import { EncryptionService } from './EncryptionService';
import { SyncService } from './SyncService';

export type StorageType = 'local' | 'cloud' | 'hybrid';

/** Verifier for the encryption password (a PBKDF2 hash, never the password) */
export const ENCRYPTION_HASH_KEY = 'grief-platform-encryption-hash';

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
    // Never persist the user ID or encryption password with the settings
    const { encryptionPassword: _pw, userId: _uid, ...persistable } = settings;
    localStorage.setItem('journal-storage-settings', JSON.stringify(persistable));
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
      for (const entry of entries) {
        if (entry.syncStatus !== 'synced') {
          await this.markEntry(entry, 'pending');
        }
      }
      if (this.hasCredentials()) {
        await this.forceSync();
      }
    }
  }

  /** True when the journal is unlocked for cloud sync on this device */
  hasCredentials(): boolean {
    return Boolean(this.storageSettings.userId && this.storageSettings.encryptionPassword);
  }

  /**
   * Check the encryption password, then unlock cloud sync with it.
   * If the cloud already holds entries, the password must decrypt them;
   * otherwise it is checked against the verifier saved on this device, if any.
   */
  async unlock(userId: string, encryptionPassword: string): Promise<void> {
    const rows = await SyncService.fetchAllRows(userId);
    const sample = rows.find((r) => !r.deleted_at) || rows[0];

    if (sample) {
      try {
        await SyncService.fromCloudRow(sample, encryptionPassword);
      } catch {
        throw new Error(
          'That encryption password does not match the one your synced entries were saved with.'
        );
      }
    } else {
      const savedHash = localStorage.getItem(ENCRYPTION_HASH_KEY);
      if (savedHash && !(await EncryptionService.verifyPassword(encryptionPassword, savedHash))) {
        throw new Error('That encryption password does not match the one set up on this device.');
      }
    }

    localStorage.setItem(ENCRYPTION_HASH_KEY, await EncryptionService.hashPassword(encryptionPassword));
    this.setUserContext(userId, encryptionPassword);
  }

  /**
   * Two-way sync: upload local entries that aren't synced, apply pending
   * deletes, then download cloud entries and merge them into this device.
   * Returns the number of entries changed on this device.
   */
  async forceSync(): Promise<number> {
    const { userId, encryptionPassword } = this.storageSettings;
    if (!userId || !encryptionPassword) {
      throw new Error('Cannot sync: journal is not unlocked');
    }

    // 1. Upload local changes
    const uploadErrors: string[] = [];
    for (const entry of await this.getAllEntries()) {
      if (entry.syncStatus === 'synced') continue;
      const error = await SyncService.uploadEntry(entry, userId, encryptionPassword);
      if (error) uploadErrors.push(error);
      else await this.markEntry(entry, 'synced');
    }

    // 2. Pending deletes
    await SyncService.processQueue(userId, encryptionPassword);

    // 3. Download and merge
    const rows = await SyncService.fetchAllRows(userId);
    let changed = 0;
    let undecryptable = 0;
    for (const row of rows) {
      const local = await this.getEntry(row.id);

      if (row.deleted_at) {
        if (local) {
          await this.deleteLocal(row.id);
          changed++;
        }
        continue;
      }

      if (local && (local.version || 0) >= row.version) continue;

      try {
        await this.putLocal(await SyncService.fromCloudRow(row, encryptionPassword));
        changed++;
      } catch {
        undecryptable++;
      }
    }

    this.setLastSyncTime(new Date());
    await SyncService.updateSyncStatus();

    if (uploadErrors.length > 0) {
      throw new Error(`Some entries could not be uploaded: ${uploadErrors[0]}`);
    }
    if (undecryptable > 0) {
      throw new Error(
        `${undecryptable} synced ${undecryptable === 1 ? 'entry was' : 'entries were'} saved with a different encryption password and can't be opened here.`
      );
    }
    return changed;
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
    const status = await SyncService.getSyncStatus();
    const unsynced =
      this.storageSettings.storageType === 'local'
        ? 0
        : (await this.getAllEntries()).filter((e) => e.syncStatus !== 'synced').length;
    return { ...status, pending: status.pending + unsynced };
  }

  /**
   * Try to upload a just-saved entry. If the journal is locked, offline, or
   * the upload fails, the entry stays 'pending' and the next sync uploads it.
   */
  private async syncToCloud(entry: JournalEntry): Promise<void> {
    const { userId, encryptionPassword } = this.storageSettings;
    if (!userId || !encryptionPassword || !navigator.onLine) return;

    try {
      const error = await SyncService.uploadEntry(entry, userId, encryptionPassword);
      if (error) {
        console.error('Sync error:', error);
        return;
      }
      await this.markEntry(entry, 'synced');
    } catch (error) {
      console.error('Cloud sync failed:', error);
    }
  }

  private async deleteFromCloud(id: string): Promise<void> {
    const userId = this.storageSettings.userId;
    const dummyEntry: JournalEntry = { id, content: '', createdAt: new Date().toISOString() };

    try {
      if (userId && navigator.onLine) {
        const { error } = await supabase
          .from('journal_entries')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId);
        if (!error) return;
        console.error('Cloud delete error:', error);
      }
    } catch (error) {
      console.error('Delete from cloud failed:', error);
    }

    // Couldn't delete now - retry on the next sync
    await SyncService.addToQueue(id, 'delete', dummyEntry);
  }

  /** Write an entry to IndexedDB as-is (no version bump, no upload) */
  private async putLocal(entry: JournalEntry): Promise<void> {
    if (!this.db) await this.initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const request = transaction.objectStore('entries').put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteLocal(id: string): Promise<void> {
    if (!this.db) await this.initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const request = transaction.objectStore('entries').delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async markEntry(entry: JournalEntry, status: JournalEntry['syncStatus']): Promise<void> {
    entry.syncStatus = status;
    await this.putLocal(entry);
  }

  getSettings(): StorageSettings {
    return { ...this.storageSettings };
  }

  updateSettings(settings: Partial<StorageSettings>): void {
    this.saveSettings({ ...this.storageSettings, ...settings });
  }
}

export const journalStorage = new JournalStorageService();
