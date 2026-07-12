# Focus Board — ADHD Soundboard

A single-page, dependency-free web app for building a background-noise mix
and running a focus timer — two of the most common tools people with ADHD
use to concentrate.

## Features

- **Mixable soundboard.** Toggle any combination of Brown/Pink/White noise,
  Rain, Ocean Waves, Fan/Wind, Fireplace, Cafe Murmur, and a Clock Tick, each
  with its own volume slider plus a master volume. All sounds are generated
  live with the Web Audio API — no audio files to download or license.
- **Focus timer.** A Pomodoro-style countdown with configurable focus/break
  lengths and an optional chime on phase change.
- **Presets.** Save the current sound mix (which sounds are on and their
  volumes) under a name, then reload or delete it later.
- **Low-stimulation UI.** Large tap targets, minimal motion, dark theme by
  default with a light theme toggle.
- **Private by default.** Mix state, presets, and theme are stored only in
  the browser's `localStorage`. Nothing is sent to a server.

## Running it

No build step or dependencies. Just serve the three static files:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL in a browser. It also works by opening
`index.html` directly, though some browsers restrict `localStorage` on
`file://` URLs — serving it locally avoids that.

## Files

- `index.html` — page structure
- `styles.css` — theme and layout
- `script.js` — audio engine, mixer/timer/preset logic
