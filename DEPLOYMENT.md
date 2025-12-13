# Deployment Guide - Grief Literacy Platform

## Render Deployment (Empfohlen)

### 1. Render Dashboard Setup

1. Gehe zu [render.com](https://render.com) und erstelle einen neuen **Web Service**
2. Verbinde dein GitHub Repository
3. Wähle den Branch `main` (oder deinen Deployment-Branch)

### 2. Build & Start Konfiguration

| Einstellung | Wert |
|-------------|------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server/index.mjs` |
| **Environment** | Node |

### 3. Environment Variables (WICHTIG!)

Vite benötigt die ENV-Variablen zur **Build-Zeit**. Setze sie im Render Dashboard unter **Environment**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://pxncjptyivohunzlzfxo.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `dein-anon-key-hier` |
| `VITE_APP_URL` | `https://deine-app.onrender.com` |
| `NODE_ENV` | `production` |
| `PORT` | `8080` (oder Render's Standard-Port) |

> ⚠️ **Wichtig:** Render macht ENV-Variablen automatisch zur Build-Zeit verfügbar - anders als Fly.io!

### 4. Render.yaml (Optional)

Erstelle eine `render.yaml` Datei für Infrastructure-as-Code:

```yaml
services:
  - type: web
    name: grief-literacy-platform
    env: node
    buildCommand: npm install && npm run build
    startCommand: node dist/server/index.mjs
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: VITE_APP_URL
        sync: false
```

---

## Fly.io Deployment (Alternative)

### Build-Args beim Deploy übergeben

Da Vite die ENV-Variablen zur Build-Zeit braucht, müssen sie als Build-Args übergeben werden:

```bash
fly deploy \
  --build-arg VITE_SUPABASE_URL="https://pxncjptyivohunzlzfxo.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="dein-anon-key-hier" \
  --build-arg VITE_APP_URL="https://grief-literacy-platform.fly.dev"
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

## GitHub Codespaces Entwicklung

### Bekannte Einschränkungen

GitHub Codespaces verwendet einen Tunnel für Port-Forwarding, der CORS-Probleme verursachen kann:

```
Access to script blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Lösung:** Die Vite-Konfiguration wurde angepasst:
- PWA ist im Dev-Modus deaktiviert (verursacht Tunnel-Auth-Probleme)
- HMR verwendet WSS über Port 443

### Port öffentlich machen

1. Öffne das **Ports**-Panel in VS Code
2. Rechtsklick auf Port 5173 → **Port Visibility** → **Public**
3. Nutze die generierte URL (z.B. `https://...app.github.dev`)

### Bekannte CORS-Fehler (ignorierbar)

Diese Fehler sind Codespaces-spezifisch und beeinträchtigen die Produktion nicht:
- `@vite/client` CORS-Fehler
- `@react-refresh` CORS-Fehler
- `site.webmanifest` 404 (PWA-Manifest im Dev-Modus)

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
