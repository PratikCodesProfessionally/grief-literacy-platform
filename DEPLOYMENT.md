# Deployment Guide - Grief Literacy Platform

## Fly.io Deployment

### 1. Voraussetzungen

```bash
# Fly CLI installieren
curl -L https://fly.io/install.sh | sh

# Einloggen
fly auth login
```

### 2. Secrets setzen (WICHTIG!)

Vite benötigt die ENV-Variablen zur **Build-Zeit**. Setze sie als Build-Secrets:

```bash
# Supabase Credentials (PFLICHT für Realtime-Features)
fly secrets set VITE_SUPABASE_URL="https://pxncjptyivohunzlzfxo.supabase.co"
fly secrets set VITE_SUPABASE_ANON_KEY="dein-anon-key-hier"

# App URL für Produktion
fly secrets set VITE_APP_URL="https://grief-literacy-platform.fly.dev"

# Optional: AI-Services
fly secrets set VITE_HUGGINGFACE_API_KEY="hf_..."
```

### 3. Build-Args beim Deploy übergeben

Da Vite die ENV-Variablen zur Build-Zeit braucht, müssen sie als Build-Args übergeben werden:

```bash
fly deploy \
  --build-arg VITE_SUPABASE_URL="https://pxncjptyivohunzlzfxo.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="dein-anon-key-hier" \
  --build-arg VITE_APP_URL="https://grief-literacy-platform.fly.dev"
```

### 4. Alternativ: .env.production Datei

Erstelle eine `.env.production` Datei im `client/` Verzeichnis (NICHT committen!):

```env
VITE_SUPABASE_URL=https://pxncjptyivohunzlzfxo.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key-hier
VITE_APP_URL=https://grief-literacy-platform.fly.dev
```

---

## Supabase Realtime Konfiguration

### Realtime für Tabellen aktivieren

Gehe zu Supabase Dashboard → Database → Replication und aktiviere Realtime für:
- `support_groups` (falls vorhanden)
- `group_messages` (falls vorhanden)

### RLS Policies (Row Level Security)

Stelle sicher, dass anonyme Nutzer Zugriff haben:

```sql
-- Für Support Groups (falls Tabellen existieren)
ALTER TABLE support_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON support_groups
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON support_groups
  FOR INSERT WITH CHECK (true);
```

---

## Troubleshooting

### Features funktionieren lokal aber nicht in Produktion

1. **Browser Console prüfen:**
   ```
   [Supabase] Configuration check: { hasUrl: false, hasKey: false }
   ```
   → ENV-Variablen wurden nicht zur Build-Zeit injiziert

2. **Fix:** Deploy mit `--build-arg` (siehe oben)

### WebSocket-Verbindung fehlgeschlagen

1. **CSP-Header prüfen:** Die App braucht Zugriff auf:
   - `wss://*.supabase.co` (WebSockets)
   - `https://*.supabase.co` (REST API)

2. Die CSP-Header sind in [server/static-serve.mts](server/static-serve.mts) konfiguriert.

### Port-Probleme

- Fly.io erwartet Port 8080 (in `fly.toml`)
- Der Server liest `PORT` aus ENV oder verwendet 8080 als Default

---

## Vercel Deployment (Alternative)

### 1. Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://pxncjptyivohunzlzfxo.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `dein-key` | Production, Preview |
| `VITE_APP_URL` | `https://deine-domain.vercel.app` | Production |

### 2. Build Command

```
npm run build
```

### 3. Output Directory

```
dist
```

---

## Lokale Entwicklung

```bash
# .env.local Datei erstellen (im client/ Verzeichnis!)
cp .env.example client/.env.local

# Werte eintragen
nano client/.env.local

# Server starten
npm run dev
```

Die App läuft auf `http://localhost:5173`
