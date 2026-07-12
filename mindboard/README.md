# Mindboard

A voice-journaling iPhone app: talk through how you're feeling, and Mindboard
transcribes it, reflects it back, and tracks mood and recurring themes over
time so patterns are easier to notice.

Two parts, both in this folder:

- **`mobile-app/`** — the Expo/React Native app (iOS-first, works on Android too)
- **`server/`** — the backend that transcribes audio (OpenAI Whisper) and
  analyzes each entry (Claude), stores everything, and computes trends

## Important: this is a wellness journal, not a clinical tool

Mindboard is a private journaling and pattern-noticing tool. It is **not**
therapy, a diagnostic tool, or a crisis service, and nothing it generates
should be treated as medical or clinical advice. The analysis is produced by
an LLM and can be wrong. If you or someone you know is in crisis, contact a
crisis line — in the US, call or text **988** — or your local emergency
number. This app cannot detect a crisis reliably and does not try to.

## How it fits together

```
iPhone (Expo app)  --audio-->  your server  --Whisper-->  transcript
                                            --Claude---->  mood + themes + reflection
                    <--JSON----
```

Everything is self-hosted: you run `server/` somewhere reachable by your
phone (a laptop on the same WiFi network for development, or a real host for
anything beyond that), and point the app at it in Settings.

## Running it

1. **Server**: see `server/README.md` — needs an `ANTHROPIC_API_KEY` and an
   `OPENAI_API_KEY`.
2. **App**: see `mobile-app/README.md` — needs a Mac with Xcode for a real
   iOS build, or Expo Go for a quick preview on a physical device.

I verified the server boots and its non-AI endpoints work, and that the
mobile app fully compiles and bundles through Metro (1040 modules, zero
errors). I could not run the app on an actual iPhone or exercise the live
Claude/Whisper calls from this environment — do that as the first thing
after setup, with a couple of real check-ins.

## Privacy

Voice recordings are sent to your server for transcription, then discarded —
only the transcript and analysis are stored. Nothing is sent to Anthropic or
OpenAI beyond what's needed for that single request/response. Everything
lives in your server's local SQLite database until you delete it (Settings →
Delete all my data).
