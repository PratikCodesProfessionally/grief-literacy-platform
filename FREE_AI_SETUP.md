# Kostenlose AI Alternativen für Grandma Sue

## 🆓 Option 1: Hugging Face (EMPFOHLEN)

### Vorteile:
- ✅ **Komplett kostenlos**
- ✅ Meta Llama 3.1 (sehr gut)
- ✅ Keine Kreditkarte nötig
- ✅ 1000 Requests/Tag gratis
- ✅ Einfache Einrichtung

### Setup:

#### 1. Kostenlosen Account erstellen
```
1. Gehe zu: https://huggingface.co/
2. Klicke auf "Sign Up" (oben rechts)
3. Erstelle Account (Email + Passwort)
4. Bestätige Email
```

#### 2. API Token erstellen
```
1. Gehe zu: https://huggingface.co/settings/tokens
2. Klicke "New token"
3. Name: "Grief Literacy Platform"
4. Type: "Read" (ausreichend)
5. Klicke "Generate"
6. Kopiere den Token (beginnt mit "hf_...")
```

#### 3. Konfigurieren
```bash
# Im Projekt-Ordner:
cp .env.example .env
nano .env
```

Füge hinzu:
```
VITE_HUGGINGFACE_API_KEY=hf_deinTokenHier
```

#### 4. Fertig!
```bash
npm run dev
```

### Kosten:
- **Komplett kostenlos** ✅
- Rate Limit: ~1000 Requests/Tag
- Für persönliche Projekte perfekt

---

## 🆓 Option 2: Lokale AI (Offline, No API needed)

### Vorteile:
- ✅ **Komplett offline**
- ✅ Keine API-Keys nötig
- ✅ 100% Privatsphäre
- ✅ Keine Rate Limits

### Setup mit Transformers.js:

```bash
npm install @xenova/transformers
```

Ich kann das implementieren, wenn Sie möchten!

---

## 🆓 Option 3: Google Gemini (Gratis Tier) - NOW INTEGRATED

### Vorteile:
- ✅ 15 Requests/Minute gratis
- ✅ Sehr gutes Modell (Gemini 1.5 Flash)
- ✅ Keine Kreditkarte
- ✅ **JETZT VOLL IMPLEMENTIERT**

### Setup:

#### 1. API Key erstellen
```
1. Gehe zu: https://aistudio.google.com/app/apikey
2. Klicke "Get API Key" oder "Create API Key"
3. Wähle "Create API key in new project" oder wähle ein bestehendes Projekt
4. Kopiere den API Key
```

#### 2. Konfigurieren
```bash
# Im Projekt-Ordner:
cp .env.example .env
nano .env
```

Füge hinzu:
```
VITE_GEMINI_API_KEY=dein-key-hier
```

#### 3. Fertig!
```bash
npm run build
npm run dev
```

### Wie es funktioniert:
- Grandma Sue erkennt automatisch verfügbare AI Services
- Gemini wird bevorzugt, wenn konfiguriert
- Toggle Button (🧠) wechselt zwischen Modi
- Automatischer Fallback zu lokalen Antworten bei Problemen

### Kosten:
- **Komplett kostenlos** ✅
- Rate Limit: 15 Requests/Minute (900/Stunde)
- Perfekt für persönliche Projekte

---

## 🆓 Option 4: OpenAI (5$ Free Credits)

### Nur beim ersten Anmelden:
- 5$ gratis Credits
- Reicht für ~1000 Gespräche
- Nach Credits: bezahlt

### Setup:
```
1. https://platform.openai.com/
2. Sign up (Telefonnummer nötig)
3. API Key erstellen
4. VITE_OPENAI_API_KEY=sk-...
```

---

## Vergleich:

| Service | Kosten | Qualität | Setup | Empfehlung |
|---------|--------|----------|-------|------------|
| **Google Gemini** | ✅ Free | ⭐⭐⭐⭐⭐ | Easy | **NEU! BESTE WAHL** |
| **Hugging Face** | ✅ Free | ⭐⭐⭐⭐ | Easy | Auch gut |
| Lokal (offline) | ✅ Free | ⭐⭐⭐ | Medium | Für Privacy |
| OpenAI | $5 free then $ | ⭐⭐⭐⭐⭐ | Easy | Nach Credits $ |
| Claude | $$$ | ⭐⭐⭐⭐⭐ | Easy | Teuer |

---

## Empfehlung:

### Für Ihr Projekt: **Google Gemini**

**Warum?**
1. **JETZT VOLL IMPLEMENTIERT** - Einfach API Key einfügen und loslegen!
2. Komplett kostenlos (15 req/min)
3. Höchste Qualität (Gemini 1.5 Flash)
4. Keine Kreditkarte nötig
5. Einfaches Setup (3 Minuten)
6. Automatische Integration mit Toggle
7. Fallback zu lokalen Antworten

### Alternative: **Hugging Face**
Wenn Sie mehr Requests/Tag brauchen.

### Alternative: **Lokale AI**
Wenn Sie 100% offline arbeiten möchten.

---

## Quick Start (Google Gemini) - EMPFOHLEN:

```bash
# 1. API Key holen (KOSTENLOS)
https://aistudio.google.com/app/apikey

# 2. Konfigurieren
echo "VITE_GEMINI_API_KEY=dein-key" > .env

# 3. Bauen und Starten
npm run build
npm run dev

# 4. Im Chat auf 🧠 klicken für Gemini!
```

**Fertig!** Grandma Sue nutzt jetzt Google Gemini AI! 🎉

---

## Fragen?

**Ist es wirklich kostenlos?**
Ja! Google Gemini Free Tier ist komplett kostenlos. Keine Kreditkarte nötig.

**Welcher Service ist der beste?**
Google Gemini (jetzt integriert!) - Beste Qualität, kostenlos, und funktioniert sofort!

**Gibt es Limits?**
Gemini: 15 Requests/Minute (900/Stunde) - mehr als genug!
Hugging Face: ~1000 Requests/Tag

**Wie gut ist die Qualität?**
Gemini 1.5 Flash ist ausgezeichnet - vergleichbar mit Claude/GPT-4!

**Brauche ich eine Kreditkarte?**
Nein! Weder für Gemini noch für Hugging Face.

**Funktioniert es auch offline?**
Nein, aber wir können lokale AI implementieren für offline use.

**Kann ich zwischen AI Services wechseln?**
Ja! Klicken Sie auf das 🧠/🤖/🤗/💭 Icon um zwischen Modi zu wechseln.

**Was passiert wenn die API nicht funktioniert?**
Grandma Sue wechselt automatisch zu lokalen ML-Antworten. Keine Sorge!
