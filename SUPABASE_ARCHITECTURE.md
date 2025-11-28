# Supabase Cloud Storage - Architektur & Implementation

## 🏗️ Architektur-Übersicht

### Komponenten-Hierarchie

```
┌─────────────────────────────────────────────────────────┐
│                      React App                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ JournalingPage│  │StorageSelector│  │ LoginForm   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼───────┐ │
│  │           AuthContext (User State)                 │ │
│  └──────┬────────────────────────────────────────────┬┘ │
│         │                                             │  │
│  ┌──────▼──────────────────┐  ┌────────────────────▼─┐ │
│  │  JournalStorageService  │  │    Supabase Client    │ │
│  └──────┬─────────┬────────┘  └───────────┬──────────┘ │
│         │         │                        │            │
│  ┌──────▼─────┐ ┌─▼────────────┐  ┌───────▼───────┐    │
│  │  IndexedDB │ │ SyncService  │  │ Supabase Auth │    │
│  │  (Local)   │ │              │  │               │    │
│  └────────────┘ └─┬────────────┘  └───────────────┘    │
│                   │                                     │
│            ┌──────▼──────────┐                          │
│            │EncryptionService│                          │
│            └─────────────────┘                          │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │   Supabase Cloud         │
        │  ┌────────────────────┐  │
        │  │  PostgreSQL DB     │  │
        │  │  - profiles        │  │
        │  │  - journal_entries │  │
        │  │  - prompts         │  │
        │  │  - sync_conflicts  │  │
        │  └────────────────────┘  │
        │  ┌────────────────────┐  │
        │  │  Row Level Security│  │
        │  └────────────────────┘  │
        └──────────────────────────┘
```

## 🔐 Verschlüsselungs-Flow

### Zero-Knowledge Encryption Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT SIDE                       │
│                                                     │
│  User writes:                                       │
│  "I miss you, Mom..."                              │
│         │                                           │
│         ▼                                           │
│  EncryptionService.encrypt(content, password)      │
│         │                                           │
│  ┌──────▼────────────────────────────────┐         │
│  │ 1. Generate random salt (16 bytes)     │         │
│  │ 2. Generate random IV (12 bytes)       │         │
│  │ 3. Derive key from password + salt     │         │
│  │    (PBKDF2, 100k iterations)           │         │
│  │ 4. Encrypt with AES-256-GCM            │         │
│  └──────┬────────────────────────────────┘         │
│         │                                           │
│         ▼                                           │
│  {                                                  │
│    ciphertext: "fX9k2Lp...",                       │
│    iv: "aBc123...",                                │
│    salt: "xYz789..."                               │
│  }                                                  │
│         │                                           │
│         ▼                                           │
│  Upload to Supabase                                 │
└─────────┼───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                   SERVER SIDE                       │
│                  (Supabase Cloud)                   │
│                                                     │
│  journal_entries table:                             │
│  ┌────────────────────────────────────────────┐    │
│  │ encrypted_content: "fX9k2Lp..."           │    │
│  │ encryption_iv: "aBc123..."                │    │
│  │ encryption_salt: "xYz789..."              │    │
│  │                                            │    │
│  │ ⚠️ Server NEVER sees plaintext!           │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  Only user with correct password can decrypt!      │
└─────────────────────────────────────────────────────┘
```

### Warum Zero-Knowledge?

1. **Privacy-First**: Selbst bei Supabase-Datenleck bleiben Einträge verschlüsselt
2. **User-Control**: Nur User mit Passwort kann lesen
3. **GDPR-Compliant**: Server hat keine Zugriff auf sensible Daten
4. **Trust-Minimierung**: Keine Notwendigkeit, Server-Betreiber zu vertrauen

## 🔄 Offline-First Sync Architecture

### Sync-Flow

```
┌─────────────────────────────────────────────────────────┐
│                    WRITE FLOW                           │
└─────────────────────────────────────────────────────────┘

User writes entry
      │
      ▼
JournalStorageService.saveEntry()
      │
      ├─► IndexedDB (immediate save)
      │   Status: "pending"
      │
      └─► SyncService.addToQueue()
          │
          ▼
    Offline?  ──Yes──► Wait in queue
          │
          No
          │
          ▼
    Encrypt + Upload to Supabase
          │
          ▼
    Update local status: "synced"


┌─────────────────────────────────────────────────────────┐
│                    SYNC FLOW                            │
└─────────────────────────────────────────────────────────┘

Background Timer (every 10 minutes)
      │
      ▼
SyncService.processQueue()
      │
      ├─► For each queued entry:
      │   │
      │   ├─► Check version conflict
      │   │   │
      │   │   ├─ Local v1, Cloud v1 ──► Upload
      │   │   │
      │   │   └─ Local v1, Cloud v2 ──► CONFLICT!
      │   │                              │
      │   │                              ▼
      │   │                        Create sync_conflicts record
      │   │                              │
      │   │                              ▼
      │   │                        Show ConflictResolution UI
      │   │
      │   └─► Encrypt + Upload
      │
      └─► Download new entries from cloud
          │
          ▼
      Merge with local
          │
          ▼
      Notify UI: "Synced"
```

## 📦 Datenbank-Schema Details

### `profiles` Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- Links to auth.users
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  storage_preference TEXT,          -- 'local' | 'cloud' | 'hybrid'
  encryption_enabled BOOLEAN,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- RLS Policy:
-- Users can only see/update their own profile
```

**Warum separates Profil?**
- Supabase `auth.users` ist read-only
- Wir brauchen schreibbare User-Metadaten
- Automatische Trigger-Erstellung bei Signup

### `journal_entries` Table

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  
  -- Encrypted fields (zero-knowledge)
  encrypted_content TEXT NOT NULL,
  encrypted_title TEXT,
  encryption_iv TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
  
  -- Metadata (not encrypted - for filtering)
  mood TEXT,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,           -- Soft delete
  
  -- Sync fields
  version INTEGER DEFAULT 1,        -- For conflict detection
  device_id TEXT NOT NULL,          -- Which device wrote this
  sync_status TEXT                  -- 'pending' | 'synced' | 'conflict'
);

-- RLS Policy:
-- Users can only CRUD their own entries (user_id = auth.uid())
```

**Design-Entscheidungen:**
- `version` field: Optimistic locking für Multi-Device Sync
- `device_id`: Conflict resolution (welches Gerät hat zuletzt geschrieben?)
- `deleted_at`: Soft delete (für Sync-Propagierung)
- Metadata unverschlüsselt: Ermöglicht Filtern nach Mood/Tags ohne Decrypt

### `sync_conflicts` Table

```sql
CREATE TABLE sync_conflicts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  entry_id UUID,                    -- Which entry has conflict
  
  local_version INTEGER,
  cloud_version INTEGER,
  
  local_data JSONB,                 -- Full local entry
  cloud_data JSONB,                 -- Full cloud entry
  
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_strategy TEXT,         -- 'keep_local' | 'keep_cloud' | 'merge'
  
  created_at TIMESTAMPTZ
);
```

**Conflict Resolution Workflow:**
1. User edits entry on Device A (offline)
2. User edits same entry on Device B (online)
3. Device B uploads v2 to cloud
4. Device A comes online, tries to upload v2
5. Server detects: Local v2 vs Cloud v2 → CONFLICT
6. Create `sync_conflicts` record
7. Show UI: "Which version do you want to keep?"
8. User chooses, mark as resolved

## 🎯 API-Endpunkte (Supabase Client)

### Authentication

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: { display_name: 'John' }
  }
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Magic Link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com'
});

// Sign Out
await supabase.auth.signOut();
```

### Journal Entries (CRUD)

```typescript
// Create/Update (Upsert)
const { data, error } = await supabase
  .from('journal_entries')
  .upsert({
    id: 'uuid',
    user_id: 'uuid',
    encrypted_content: '...',
    encryption_iv: '...',
    encryption_salt: '...',
    version: 1
  });

// Read (with filters)
const { data, error } = await supabase
  .from('journal_entries')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(50);

// Soft Delete
const { error } = await supabase
  .from('journal_entries')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', entryId)
  .eq('user_id', userId);
```

### Conflict Management

```typescript
// Get conflicts
const { data, error } = await supabase
  .from('sync_conflicts')
  .select('*')
  .eq('user_id', userId)
  .eq('resolved', false);

// Resolve conflict
await supabase
  .from('sync_conflicts')
  .update({
    resolved: true,
    resolved_at: new Date().toISOString(),
    resolution_strategy: 'keep_local'
  })
  .eq('id', conflictId);
```

## 🔍 Code-Struktur

### Service-Layer

```
client/src/services/
├── EncryptionService.ts       # AES-256-GCM encryption
├── SyncService.ts             # Offline-first sync logic
├── JournalStorageService.ts   # Main storage abstraction
└── StorageService.ts          # Legacy (to be migrated)
```

### Context-Layer

```
client/src/contexts/
└── AuthContext.tsx            # User authentication state
```

### Component-Layer

```
client/src/components/
├── StorageSelector.tsx        # Storage type selection
└── auth/
    ├── LoginForm.tsx          # Email/password login
    ├── SignupForm.tsx         # Account creation
    └── ConflictResolution.tsx # Sync conflict UI
```

## 📊 Performance-Optimierungen

### IndexedDB (Local Storage)

```typescript
// Why IndexedDB?
- ✅ 50MB+ storage (vs 5MB localStorage)
- ✅ Indexed queries (fast search)
- ✅ Async API (non-blocking)
- ✅ Structured data (objects, not strings)
```

### Sync Optimization

```typescript
// Batch uploads (nicht einzeln)
for (const item of queue) {
  await uploadBatch([item]); // könnte batchen für efficiency
}

// Incremental sync (nur Änderungen seit letztem Sync)
const lastSync = getLastSyncTime();
const { data } = await supabase
  .from('journal_entries')
  .select('*')
  .gt('updated_at', lastSync.toISOString());
```

### Network Optimization

```typescript
// Background sync (nicht blockierend)
setInterval(async () => {
  await SyncService.processQueue();
}, 10 * 60 * 1000); // 10 Minuten

// Online/Offline Detection
window.addEventListener('online', () => {
  SyncService.forceSync(); // Sofort syncen wenn zurück online
});
```

## 🐛 Debugging-Tipps

### Browser DevTools

```javascript
// IndexedDB inspizieren
// DevTools > Application > IndexedDB > grief-platform-sync

// Sync-Queue anzeigen
SyncService.getQueue().then(console.log);

// Sync-Status
SyncService.getSyncStatus().then(console.log);

// Encryption testen
EncryptionService.encrypt('test', 'password123').then(console.log);
```

### Supabase Dashboard

```
1. Table Editor: Sehe verschlüsselte Einträge
2. Authentication > Users: Sehe registrierte User
3. Logs > Edge Functions: Sehe API-Requests
4. Database > Roles: Überprüfe RLS-Policies
```

## 🚀 Nächste Schritte (Erweiterungen)

### Geplante Features

1. **Bulk Export**
   - Download aller Einträge als JSON/PDF
   - Encrypted backup file

2. **Selective Sync**
   - User wählt welche Einträge zu syncen
   - Tag-basiertes Sync (nur "work" entries sync zu work device)

3. **Collaborative Journaling**
   - Shared journal mit Partner/Therapeut
   - End-to-end encrypted sharing

4. **Voice Journaling**
   - Audio-Aufnahmen
   - Speech-to-text mit AI
   - Encrypted audio files in Supabase Storage

5. **Analytics Dashboard**
   - Mood trends über Zeit
   - Schreibstatistiken
   - Privacy-preserving (nur lokal berechnet)

## 📝 Checkliste für Production

- [ ] Environment Variables in Produktion setzen
- [ ] SMTP für Emails konfigurieren
- [ ] Custom Domain für Supabase Auth
- [ ] Rate Limiting aktivieren (Supabase Settings)
- [ ] Backups konfigurieren (täglich)
- [ ] Monitoring setup (Sentry, LogRocket)
- [ ] GDPR-Compliance überprüfen
- [ ] Datenschutzerklärung aktualisieren
- [ ] Security Audit durchführen
- [ ] Load Testing (k6, Artillery)

---

**Erstellt für Grief Literacy Platform** 💙  
Version 1.0 - Januar 2025
