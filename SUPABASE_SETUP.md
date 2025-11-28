# Supabase Cloud Storage Setup Guide

Dieses Dokument erklärt, wie Sie Supabase für die Grief Literacy Platform einrichten und konfigurieren.

## 🎯 Übersicht

Die Plattform nutzt Supabase für:
- **Authentifizierung**: Email/Password + Magic Links
- **Datenbank**: PostgreSQL für verschlüsselte Journal-Einträge
- **Offline-First Sync**: Automatische Hintergrundsynchronisation
- **Zero-Knowledge Encryption**: Client-seitige AES-256-GCM Verschlüsselung

## 📋 Voraussetzungen

- Kostenloses Supabase-Konto: https://app.supabase.com
- Node.js 18+ installiert
- Git installiert

## 🚀 Schritt 1: Supabase-Projekt erstellen

1. **Anmelden bei Supabase**
   ```
   https://app.supabase.com
   ```

2. **Neues Projekt erstellen**
   - Klicken Sie auf "New Project"
   - Wählen Sie Ihre Organization
   - Projektname: `grief-literacy-platform`
   - Database Password: Sicheres Passwort wählen (wird für direkte DB-Zugriffe benötigt)
   - Region: Wählen Sie die nächstgelegene Region (z.B. `Europe West (Ireland)`)
   - Klicken Sie auf "Create new project"

3. **Warten Sie auf Projektinitialisierung** (~2 Minuten)

## 🔑 Schritt 2: API-Schlüssel abrufen

1. **Gehen Sie zu Project Settings**
   - Klicken Sie auf das Zahnrad-Symbol (Settings) in der Sidebar
   - Wählen Sie "API" aus

2. **Kopieren Sie die folgenden Werte:**
   - `Project URL` (z.B. `https://abcdefghijklm.supabase.co`)
   - `anon public` Key (langer String beginnend mit `eyJ...`)

3. **Umgebungsvariablen setzen:**
   
   Erstellen Sie `.env.local` im Projekt-Root:
   ```bash
   cp .env.example .env.local
   ```

   Bearbeiten Sie `.env.local` und fügen Sie Ihre Werte ein:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://ihre-projekt-id.supabase.co
   VITE_SUPABASE_ANON_KEY=ihr-anon-key-hier

   # App Configuration
   VITE_APP_URL=http://localhost:5173
   VITE_ENABLE_ENCRYPTION=true
   VITE_SYNC_INTERVAL_MINUTES=10
   ```

## 🗄️ Schritt 3: Datenbank-Schema einrichten

1. **Gehen Sie zum SQL Editor**
   - Klicken Sie auf "SQL Editor" in der Sidebar
   - Klicken Sie auf "New query"

2. **Datenbank-Schema ausführen**
   
   Öffnen Sie die Datei `supabase-schema.sql` im Projekt-Root und kopieren Sie den gesamten Inhalt.
   
   Oder führen Sie direkt aus:
   ```bash
   # Wenn Sie Supabase CLI installiert haben:
   supabase db push
   
   # Ansonsten: Inhalt von supabase-schema.sql in SQL Editor kopieren und ausführen
   ```

3. **Überprüfen Sie die erstellten Tabellen**
   
   Gehen Sie zu "Table Editor" und stellen Sie sicher, dass folgende Tabellen existieren:
   - ✅ `profiles`
   - ✅ `journal_entries`
   - ✅ `prompts`
   - ✅ `user_prompt_history`
   - ✅ `sync_conflicts`

## 🔐 Schritt 4: Row Level Security (RLS) überprüfen

1. **Gehen Sie zu Authentication > Policies**

2. **Überprüfen Sie, dass RLS aktiv ist für:**
   - `profiles`: Users can view/update own profile
   - `journal_entries`: Users can CRUD own entries
   - `prompts`: All authenticated users can read
   - `user_prompt_history`: Users can view/insert own history
   - `sync_conflicts`: Users can view/update own conflicts

3. **Policies sollten automatisch erstellt sein** (durch `supabase-schema.sql`)

## 📧 Schritt 5: Email-Authentifizierung konfigurieren

1. **Gehen Sie zu Authentication > Settings**

2. **Email Provider konfigurieren:**
   - Scroll zu "SMTP Settings"
   - Für Tests: Verwenden Sie Supabase's Standard-SMTP (funktioniert sofort)
   - Für Produktion: Konfigurieren Sie Ihren eigenen SMTP (z.B. SendGrid, Mailgun)

3. **Email Templates anpassen (optional):**
   - Gehen Sie zu "Email Templates"
   - Passen Sie "Confirm signup" und "Magic Link" Templates an
   - Fügen Sie Ihr Branding hinzu

4. **Site URL setzen:**
   - Gehen Sie zu "URL Configuration"
   - Site URL: `http://localhost:5173` (für Entwicklung)
   - Redirect URLs: `http://localhost:5173/**` (Wildcard erlauben)
   - Für Produktion: Ihre echte Domain hinzufügen

## 🧪 Schritt 6: Installation testen

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. **Testen Sie die Authentifizierung:**
   - Öffnen Sie `http://localhost:5173`
   - Wählen Sie "Cloud" oder "Hybrid" Storage
   - Erstellen Sie einen Test-Account
   - Verifizieren Sie die Email (im Inbox checken)
   - Loggen Sie sich ein

4. **Testen Sie Journal-Einträge:**
   - Erstellen Sie einen Journal-Eintrag
   - Überprüfen Sie in Supabase > Table Editor > `journal_entries`
   - Sie sollten einen verschlüsselten Eintrag sehen (`encrypted_content`)

## 🔄 Schritt 7: Offline-Sync testen

1. **Erstellen Sie einen Eintrag während online:**
   - Journal-Eintrag schreiben
   - Sollte sofort synchronisieren

2. **Testen Sie Offline-Modus:**
   - Öffnen Sie Browser DevTools (F12)
   - Gehen Sie zu "Network" Tab
   - Setzen Sie "Offline" Checkbox
   - Schreiben Sie einen neuen Eintrag
   - Sollte lokal gespeichert werden

3. **Zurück online gehen:**
   - Deaktivieren Sie "Offline" Checkbox
   - Warten Sie 10 Sekunden (Standard Sync-Intervall)
   - Eintrag sollte automatisch synchronisieren
   - Überprüfen Sie in Supabase Table Editor

## 📊 Schritt 8: Storage-Limits überwachen

### Free Tier Limits (Supabase):
- ✅ 500 MB Datenbank
- ✅ 1 GB Datei-Storage
- ✅ 2 GB Bandwidth pro Monat
- ✅ 50.000 Monthly Active Users
- ✅ 500 MB Edge Functions Invocations

### Limits überprüfen:
1. Gehen Sie zu Project Settings > Usage
2. Überwachen Sie:
   - Database Size
   - Bandwidth
   - Edge Function Invocations

### Bei Limit-Überschreitung:
- Upgrade auf Pro Plan ($25/Monat)
- Oder optimieren Sie Daten (alte Einträge archivieren)

## 🛡️ Sicherheits-Best-Practices

### ✅ Was implementiert ist:
- Client-seitige Verschlüsselung (AES-256-GCM)
- Row Level Security (RLS)
- Email-Verifizierung
- Passwort-Hashing (bcrypt von Supabase)
- HTTPS-only (Supabase erzwingt dies)

### ⚠️ Wichtige Hinweise:
1. **Niemals** `.env.local` committen!
2. **Niemals** Encryption Password im Code hardcoden
3. **Immer** HTTPS in Produktion verwenden
4. **Regelmäßig** Backups erstellen (Supabase macht täglich automatische Backups)

## 🔧 Troubleshooting

### Problem: "Invalid API key"
**Lösung:**
- Überprüfen Sie `.env.local`
- Stellen Sie sicher, dass `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` korrekt sind
- Neustart des Dev-Servers: `npm run dev`

### Problem: "Row Level Security policy violation"
**Lösung:**
- Gehen Sie zu Supabase > Authentication > Policies
- Überprüfen Sie, ob Policies aktiv sind
- Re-run `supabase-schema.sql` falls nötig

### Problem: "Encryption failed"
**Lösung:**
- Browser-Kompatibilität: Chrome/Firefox/Safari 100+
- Stellen Sie sicher, dass `VITE_ENABLE_ENCRYPTION=true` gesetzt ist
- Überprüfen Sie Browser-Console auf Fehler

### Problem: "Sync not working"
**Lösung:**
- Überprüfen Sie Network-Tab: Läuft Supabase?
- Überprüfen Sie `VITE_SYNC_INTERVAL_MINUTES` Einstellung
- Öffnen Sie IndexedDB in Browser DevTools > Application > IndexedDB
- Überprüfen Sie `grief-platform-sync` Datenbank

### Problem: Email nicht erhalten
**Lösung:**
- Überprüfen Sie Spam-Ordner
- Gehen Sie zu Supabase > Authentication > Users
- Manuell User verifizieren für Tests
- SMTP-Settings überprüfen

## 📚 Weitere Ressourcen

- [Supabase Dokumentation](https://supabase.com/docs)
- [Supabase Auth Dokumentation](https://supabase.com/docs/guides/auth)
- [Supabase Database Dokumentation](https://supabase.com/docs/guides/database)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Support

Bei Problemen:
1. Überprüfen Sie Browser-Console (F12)
2. Überprüfen Sie Supabase Logs (Project > Logs)
3. Erstellen Sie ein GitHub Issue mit:
   - Fehlermeldung
   - Browser/OS Version
   - Schritte zum Reproduzieren

## 🎉 Fertig!

Sie haben jetzt ein vollständig funktionsfähiges Cloud-Storage-System mit:
- ✅ Zero-Knowledge Verschlüsselung
- ✅ Offline-First Architektur
- ✅ Multi-Device Sync
- ✅ Conflict Resolution
- ✅ GDPR-konform (Encryption + User-Control)

Viel Erfolg mit Ihrer Grief Literacy Platform! 💙
