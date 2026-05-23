/**
 * Offline-First Sync Service
 * Manages background synchronization between local IndexedDB and Supabase
 */

import { supabase } from '../lib/supabase';
import { EncryptionService } from './EncryptionService';
import { JournalEntry } from './JournalStorageService';

export interface SyncQueueItem {
  id: string;
  entryId: string;
  operation: 'create' | 'update' | 'delete';
  data: JournalEntry;
  timestamp: number;
  retries: number;
}

export interface SyncStatus {
  pending: number;
  synced: number;
  conflicts: number;
  lastSync: Date | null;
  online: boolean;
}

export class SyncService {
  private static DB_NAME = 'grief-platform-sync';
  private static DB_VERSION = 1;
  private static SYNC_QUEUE_STORE = 'sync_queue';
  private static SYNC_STATUS_STORE = 'sync_status';
  private static db: IDBDatabase | null = null;
  private static syncInterval: number | null = null;
  private static isOnline = navigator.onLine;
  private static listeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Initialize sync service
   */
  static async init(): Promise<void> {
    await this.openDatabase();
    this.startOnlineMonitoring();
    await this.startBackgroundSync();
  }

  /**
   * Open IndexedDB for sync queue
   */
  private static async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.SYNC_QUEUE_STORE)) {
          const queueStore = db.createObjectStore(this.SYNC_QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('entryId', 'entryId', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.SYNC_STATUS_STORE)) {
          db.createObjectStore(this.SYNC_STATUS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Add item to sync queue
   */
  static async addToQueue(
    entryId: string,
    operation: 'create' | 'update' | 'delete',
    data: JournalEntry
  ): Promise<void> {
    if (!this.db) await this.openDatabase();

    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      entryId,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
      const request = store.add(item);

      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from sync queue
   */
  static async getQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item from sync queue
   */
  static async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Process sync queue - upload local changes to cloud
   */
  static async processQueue(userId: string, encryptionPassword: string): Promise<void> {
    if (!this.isOnline) {
      console.log('Offline - skipping sync');
      return;
    }

    const queue = await this.getQueue();
    const deviceId = EncryptionService.generateDeviceId();

    for (const item of queue) {
      try {
        if (item.operation === 'create' || item.operation === 'update') {
          // Encrypt content before upload
          const encryptedContent = await EncryptionService.encrypt(
            item.data.content,
            encryptionPassword
          );
          const encryptedTitle = item.data.title
            ? await EncryptionService.encrypt(item.data.title, encryptionPassword)
            : null;

          const cloudData = {
            id: item.data.id,
            user_id: userId,
            encrypted_content: encryptedContent.ciphertext,
            encrypted_title: encryptedTitle?.ciphertext || null,
            encryption_iv: encryptedContent.iv,
            encryption_salt: encryptedContent.salt,
            mood: item.data.mood || null,
            tags: item.data.tags || [],
            created_at: item.data.createdAt,
            updated_at: new Date().toISOString(),
            version: item.data.version || 1,
            device_id: deviceId,
            sync_status: 'synced' as const,
          };

          // Check for conflicts (version mismatch)
          const { data: existing } = await supabase
            .from('journal_entries')
            .select('version, updated_at')
            .eq('id', item.data.id)
            .eq('user_id', userId)
            .single();

          if (existing && existing.version > (item.data.version || 1)) {
            // Conflict detected
            await this.createConflict(userId, item.data, existing);
            await this.removeFromQueue(item.id);
            continue;
          }

          // Upsert to Supabase
          const { error } = await supabase.from('journal_entries').upsert(cloudData);

          if (error) {
            console.error('Sync error:', error);
            item.retries++;
            if (item.retries > 3) {
              console.error('Max retries reached for item:', item.id);
              await this.removeFromQueue(item.id);
            }
          } else {
            await this.removeFromQueue(item.id);
          }
        } else if (item.operation === 'delete') {
          // Soft delete (mark as deleted)
          const { error } = await supabase
            .from('journal_entries')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.entryId)
            .eq('user_id', userId);

          if (error) {
            console.error('Delete sync error:', error);
          } else {
            await this.removeFromQueue(item.id);
          }
        }
      } catch (error) {
        console.error('Failed to process queue item:', error);
        item.retries++;
      }
    }

    // Update last sync time
    await this.updateSyncStatus();
  }

  /**
   * Download changes from cloud to local
   */
  static async downloadFromCloud(
    userId: string,
    encryptionPassword: string,
    lastSyncAt: Date | null
  ): Promise<JournalEntry[]> {
    if (!this.isOnline) {
      return [];
    }

    try {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (lastSyncAt) {
        query = query.gt('updated_at', lastSyncAt.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Download error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Decrypt entries
      const decryptedEntries: JournalEntry[] = [];
      for (const cloudEntry of data) {
        try {
          const content = await EncryptionService.decrypt(
            {
              ciphertext: cloudEntry.encrypted_content,
              iv: cloudEntry.encryption_iv,
              salt: cloudEntry.encryption_salt,
            },
            encryptionPassword
          );

          const title = cloudEntry.encrypted_title
            ? await EncryptionService.decrypt(
                {
                  ciphertext: cloudEntry.encrypted_title,
                  iv: cloudEntry.encryption_iv,
                  salt: cloudEntry.encryption_salt,
                },
                encryptionPassword
              )
            : undefined;

          decryptedEntries.push({
            id: cloudEntry.id,
            content,
            title,
            mood: cloudEntry.mood || undefined,
            tags: cloudEntry.tags || [],
            createdAt: cloudEntry.created_at,
            updatedAt: cloudEntry.updated_at,
            version: cloudEntry.version,
            syncStatus: 'synced',
          });
        } catch (error) {
          console.error('Failed to decrypt entry:', cloudEntry.id, error);
        }
      }

      await this.updateSyncStatus();
      return decryptedEntries;
    } catch (error) {
      console.error('Download from cloud failed:', error);
      return [];
    }
  }

  /**
   * Create conflict record in database
   */
  private static async createConflict(
    userId: string,
    localData: JournalEntry,
    cloudData: any
  ): Promise<void> {
    try {
      await supabase.from('sync_conflicts').insert({
        user_id: userId,
        entry_id: localData.id,
        local_version: localData.version || 1,
        cloud_version: cloudData.version,
        local_data: localData,
        cloud_data: cloudData,
        resolved: false,
      });

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to create conflict record:', error);
    }
  }

  /**
   * Get unresolved conflicts for user
   */
  static async getConflicts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sync_conflicts')
        .select('*')
        .eq('user_id', userId)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch conflicts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get conflicts error:', error);
      return [];
    }
  }

  /**
   * Resolve conflict with selected strategy
   */
  static async resolveConflict(
    conflictId: string,
    strategy: 'keep_local' | 'keep_cloud' | 'merge',
    mergedData?: JournalEntry
  ): Promise<void> {
    try {
      await supabase
        .from('sync_conflicts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_strategy: strategy,
        })
        .eq('id', conflictId);

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }

  /**
   * Update sync status
   */
  private static async updateSyncStatus(): Promise<void> {
    if (!this.db) return;

    const queue = await this.getQueue();
    const conflicts = await supabase
      .from('sync_conflicts')
      .select('id', { count: 'exact', head: true });

    const status = {
      id: 'current',
      lastSync: new Date().toISOString(),
      pendingCount: queue.length,
      conflictCount: conflicts.count || 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_STATUS_STORE], 'readwrite');
      const store = transaction.objectStore(this.SYNC_STATUS_STORE);
      const request = store.put(status);

      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    const queue = await this.getQueue();
    const conflicts = await supabase
      .from('sync_conflicts')
      .select('id', { count: 'exact', head: true });

    let lastSync: Date | null = null;
    if (this.db) {
      const status: any = await new Promise((resolve) => {
        const transaction = this.db!.transaction([this.SYNC_STATUS_STORE], 'readonly');
        const store = transaction.objectStore(this.SYNC_STATUS_STORE);
        const request = store.get('current');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });

      if (status?.lastSync) {
        lastSync = new Date(status.lastSync);
      }
    }

    return {
      pending: queue.length,
      synced: 0,
      conflicts: conflicts.count || 0,
      lastSync,
      online: this.isOnline,
    };
  }

  /**
   * Start background sync (every X minutes)
   */
  private static async startBackgroundSync(): Promise<void> {
    const intervalMinutes = parseInt(import.meta.env.VITE_SYNC_INTERVAL_MINUTES || '10');
    const intervalMs = intervalMinutes * 60 * 1000;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      const userId = localStorage.getItem('grief-platform-user-id');
      const encryptionPassword = sessionStorage.getItem('grief-platform-encryption-password');

      if (userId && encryptionPassword && this.isOnline) {
        this.processQueue(userId, encryptionPassword).catch(console.error);
      }
    }, intervalMs);
  }

  /**
   * Monitor online/offline status
   */
  private static startOnlineMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      console.log('Back online - resuming sync');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
      console.log('Offline - sync paused');
    });
  }

  /**
   * Subscribe to sync status changes
   */
  static subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of status change
   */
  private static async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  /**
   * Force immediate sync
   */
  static async forceSync(userId: string, encryptionPassword: string): Promise<void> {
    await this.processQueue(userId, encryptionPassword);
    await this.downloadFromCloud(userId, encryptionPassword, null);
  }

  /**
   * Clear sync queue (for testing/reset)
   */
  static async clearQueue(): Promise<void> {
    if (!this.db) await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}
