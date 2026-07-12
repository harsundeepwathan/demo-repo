# Anchor

A task planner for ADHD adults, built around overwhelm, time blindness, and motivation — not a Todoist clone.

**This is a private planning tool, not therapy or medical care. It does not diagnose anything and is not a substitute for a mental health professional.**

## Why it's different

Most task apps assume you'll reliably plan, prioritize, and follow through. Anchor assumes the opposite is normal:

- **One Thing mode** — a full-screen view of a single task, nothing else, so you're never staring at 40 open loops at once.
- **Now / Next / Someday**, not due dates — time blindness makes deadlines unreliable motivators; relative priority is more honest.
- **Cards never disappear when you defer them** — "Not now" moves a task to Next, it never gets silently dropped.
- **Streaks never reset to zero** — missed days just don't increment the counter. There's no "you broke your streak" shame state anywhere in the UI.
- **Push-count nudges** — if a task has been deferred 5+ times, Anchor gently asks if it should be broken down or let go, instead of just sitting there forever.
- **No red, no urgency colors, no leaderboards, no aggressive notifications.** The palette is muted on purpose.

## Stack

- Expo SDK 57 / React Native 0.86 / TypeScript, file-based routing via `expo-router`
- Local-first storage via `expo-sqlite` (no backend required)
- On-device speech-to-text via `expo-speech-recognition` for voice capture (requires a dev client build — not available in Expo Go)
- Task breakdown assistant calls the Anthropic Messages API directly from the client using a key you provide in Settings, stored via `expo-secure-store`. This is fine for personal use; if you ever ship this to the App Store, proxy that call through a backend instead of embedding a key in the client bundle.

## Running it

```
npm install
npx expo start
```

Voice capture and the native SQLite backend require a real device or simulator via a dev client (`npx expo run:ios` / `npx expo run:android`) — Expo Go won't have the speech recognition native module.

## Project layout

- `app/` — screens (expo-router file-based routes)
- `components/` — UI building blocks
- `lib/db.ts` — SQLite schema and all data access
- `lib/theme.ts` — the muted color system
