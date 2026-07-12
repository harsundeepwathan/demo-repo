# Mindboard server

Express + TypeScript backend for the Mindboard app. Transcribes voice entries
(OpenAI Whisper), analyzes them for mood/themes/reflection (Claude), stores
them in a local SQLite file, and computes mood-trend + theme-frequency
insights.

## Setup

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY and OPENAI_API_KEY
npm run dev
```

Server listens on `http://localhost:4000` by default (override with `PORT`).
On first run it creates `mindboard.db` (SQLite) next to `package.json`.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/entries` | Multipart upload, field `audio` — transcribes, analyzes, stores, returns the entry |
| `GET` | `/api/entries?limit=50` | List entries, newest first |
| `GET` | `/api/entries/:id` | One entry |
| `DELETE` | `/api/entries` | Delete all entries |
| `GET` | `/api/insights` | Mood trend by day, top recurring themes, plain-language observations |

## How analysis works

`src/services/transcribe.ts` calls OpenAI's Whisper API for speech-to-text —
swap this file for a different STT provider if you'd rather not use OpenAI
for that step; nothing else depends on it.

`src/services/analyze.ts` calls Claude (`claude-opus-4-8`) with a forced tool
call (`record_analysis`) so the response is always structured: a mood score
from -5 to 5, 2-5 recurring themes, a short warm reflection, and one small
everyday suggestion. The system prompt explicitly tells the model it is not a
therapist, must not diagnose, and — if the transcript mentions self-harm or
crisis — should point toward a trusted person or a crisis line instead of a
generic tip. This is a best-effort safety instruction, not a guarantee; the
app's crisis-resources banner is always visible regardless of what the model
outputs.

`src/services/insights.ts` is plain arithmetic (no extra LLM call) — it
buckets entries by day for the mood trend, counts theme frequency, and
generates a couple of observation strings when a theme repeats 3+ times in a
week or the weekly mood average shifts sharply. Keeping this deterministic
means insights are always available even if the analysis step were to
change.

## Exposing it to your phone

For development, run the server on a machine on the same WiFi network as
your phone and use that machine's LAN IP (e.g. `http://192.168.1.20:4000`) in
the app's Settings screen — `localhost` on your phone means the phone
itself, not your computer. For anything beyond local development, deploy
this behind HTTPS and put real auth in front of it before it's reachable
from the internet; there is none built in.
