# Mindboard (mobile app)

Expo Router / React Native app. Four tabs — Talk, History, Patterns,
Settings — plus an entry detail screen.

## Setup

```bash
npm install
```

Then point it at your running `server/` (see the server README):

1. Start the app: `npx expo start`
2. Scan the QR code with **Expo Go** on your phone (fastest way to try it —
   no Xcode needed), or press `i`/`a` to launch an iOS/Android
   simulator/emulator if you have one set up.
3. Open the **Settings** tab in the app and enter your server's address
   (your computer's LAN IP, not `localhost` — e.g. `http://192.168.1.20:4000`).
   Tap **Save & test connection**.
4. Go to **Talk**, tap the record button, say something, tap it again to
   stop. It uploads, transcribes, and shows a reflection.

For a real installable iOS build (not just Expo Go), you'll need a Mac with
Xcode and to run `npx expo run:ios` or set up an EAS Build — I can't produce
or test that binary from this environment.

## What I verified vs. what you should check

I verified: `tsc --noEmit` passes cleanly, and `npx expo export --platform
ios` bundles the entire app (1040 modules, all four screens, navigation,
audio recording, the SVG trend chart, AsyncStorage) with zero errors. I have
not run this on a physical device or simulator, and I have not exercised the
live record → upload → transcribe → analyze round trip — that depends on a
running server with real API keys, which only you can provide. Please try
that full flow yourself as the first step after setup.

## Structure

- `app/(tabs)/index.tsx` — record a check-in (idle → recording → uploading → result)
- `app/(tabs)/history.tsx` — list of past entries
- `app/(tabs)/patterns.tsx` — mood trend chart, recurring themes, observations
- `app/(tabs)/settings.tsx` — server address, privacy note, delete-all-data
- `app/entry/[id].tsx` — full detail for one entry
- `lib/api.ts` — talks to the server
- `lib/storage.ts` — persists the server address on-device
- `components/TrendChart.tsx` — hand-rolled SVG line chart (no charting library)
- `components/CrisisBanner.tsx` — always-visible crisis resources, shown on Talk and Settings

## Notes on scope

This is a real Expo/React Native app, not a demo — but it intentionally
keeps things simple: no push notifications, no background audio, no offline
queueing of recordings. Those are reasonable next steps if this becomes a
daily-use app, but weren't asked for and would add real complexity (retry
logic, background task permissions) for a first version.
