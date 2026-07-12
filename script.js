"use strict";

/* ----------------------------------------------------------------------
 * Audio engine: every sound is generated procedurally in the browser
 * with the Web Audio API, so there are no audio files to ship or license.
 * -------------------------------------------------------------------- */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  const active = new Map(); // id -> { stop() }

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setMasterVolume(v) {
    getCtx();
    masterGain.gain.value = v;
  }

  function makeNoiseBuffer(context, color) {
    const bufferSize = context.sampleRate * 4;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    if (color === "white") {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (color === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.11;
      }
    } else if (color === "brown") {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buffer;
  }

  function loopedNoiseSource(context, color) {
    const src = context.createBufferSource();
    src.buffer = makeNoiseBuffer(context, color);
    src.loop = true;
    return src;
  }

  function makeLFOGain(context, destinationGain, { rate, depth, base }) {
    const lfo = context.createOscillator();
    lfo.frequency.value = rate;
    const lfoGain = context.createGain();
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain);
    lfoGain.connect(destinationGain.gain);
    destinationGain.gain.value = base;
    lfo.start();
    return lfo;
  }

  // Continuous "color" sounds built from a filtered noise chain.
  function buildContinuous(id, chainFn) {
    const context = getCtx();
    const out = context.createGain();
    out.gain.value = 0;
    out.connect(masterGain);
    const extraNodes = chainFn(context, out) || [];

    out.gain.linearRampToValueAtTime(1, context.currentTime + 0.6);

    return {
      stop(fadeSeconds = 0.4) {
        const now = context.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + fadeSeconds);
        setTimeout(() => {
          extraNodes.forEach((n) => {
            try { n.stop && n.stop(); } catch (e) {}
            try { n.disconnect && n.disconnect(); } catch (e) {}
          });
          try { out.disconnect(); } catch (e) {}
        }, fadeSeconds * 1000 + 50);
      },
      setVolume(v) {
        out.gain.setTargetAtTime(v, context.currentTime, 0.05);
      },
      gainNode: out,
    };
  }

  // Event-based sounds (clock tick, fireplace crackle) driven by a scheduler.
  function buildScheduled(id, scheduleFn) {
    const context = getCtx();
    const out = context.createGain();
    out.gain.value = 1;
    out.connect(masterGain);
    let volume = 0.7;
    const timers = [];

    function schedule() {
      const wait = scheduleFn(context, out, volume);
      timers.push(setTimeout(schedule, wait));
    }
    schedule();

    return {
      stop() {
        timers.forEach(clearTimeout);
        try { out.disconnect(); } catch (e) {}
      },
      setVolume(v) {
        volume = v;
      },
      gainNode: out,
    };
  }

  const BUILDERS = {
    white: () =>
      buildContinuous("white", (context, out) => {
        const src = loopedNoiseSource(context, "white");
        src.connect(out);
        src.start();
        return [src];
      }),

    pink: () =>
      buildContinuous("pink", (context, out) => {
        const src = loopedNoiseSource(context, "pink");
        src.connect(out);
        src.start();
        return [src];
      }),

    brown: () =>
      buildContinuous("brown", (context, out) => {
        const src = loopedNoiseSource(context, "brown");
        src.connect(out);
        src.start();
        return [src];
      }),

    rain: () =>
      buildContinuous("rain", (context, out) => {
        const src = loopedNoiseSource(context, "pink");
        const bandpass = context.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 3200;
        bandpass.Q.value = 0.6;

        const shimmerGain = context.createGain();
        shimmerGain.gain.value = 1;

        src.connect(bandpass);
        bandpass.connect(shimmerGain);
        shimmerGain.connect(out);
        src.start();

        const lfo = makeLFOGain(context, shimmerGain, { rate: 0.35, depth: 0.15, base: 0.85 });
        return [src, lfo];
      }),

    ocean: () =>
      buildContinuous("ocean", (context, out) => {
        const src = loopedNoiseSource(context, "brown");
        const lowpass = context.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 900;

        const waveGain = context.createGain();
        src.connect(lowpass);
        lowpass.connect(waveGain);
        waveGain.connect(out);
        src.start();

        const lfo = makeLFOGain(context, waveGain, { rate: 0.12, depth: 0.5, base: 0.7 });
        return [src, lfo];
      }),

    fan: () =>
      buildContinuous("fan", (context, out) => {
        const src = loopedNoiseSource(context, "white");
        const lowpass = context.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 1100;
        lowpass.Q.value = 1.2;

        const hum = context.createOscillator();
        hum.type = "sine";
        hum.frequency.value = 100;
        const humGain = context.createGain();
        humGain.gain.value = 0.03;

        src.connect(lowpass);
        lowpass.connect(out);
        hum.connect(humGain);
        humGain.connect(out);
        src.start();
        hum.start();
        return [src, hum];
      }),

    fireplace: () =>
      buildContinuous("fireplace-bed", (context, out) => {
        const src = loopedNoiseSource(context, "brown");
        const lowpass = context.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 500;
        src.connect(lowpass);
        lowpass.connect(out);
        src.start();
        return [src];
      }),

    clock: () =>
      buildScheduled("clock", (context, out, volume) => {
        const now = context.currentTime;
        const osc = context.createOscillator();
        osc.type = "square";
        osc.frequency.value = 1400;
        const g = context.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(volume * 0.5, now + 0.003);
        g.gain.linearRampToValueAtTime(0, now + 0.03);
        osc.connect(g);
        g.connect(out);
        osc.start(now);
        osc.stop(now + 0.04);
        return 1000;
      }),

    cafe: () =>
      buildContinuous("cafe", (context, out) => {
        const src = loopedNoiseSource(context, "pink");
        const bandpass = context.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 500;
        bandpass.Q.value = 0.5;

        const murmurGain = context.createGain();
        src.connect(bandpass);
        bandpass.connect(murmurGain);
        murmurGain.connect(out);
        src.start();

        const lfo = makeLFOGain(context, murmurGain, { rate: 0.6, depth: 0.25, base: 0.6 });
        return [src, lfo];
      }),
  };

  // Fireplace crackle is layered on top of the fireplace continuous bed
  // via a second scheduled sound sharing the same id namespace.
  function addFireplaceCrackle() {
    return buildScheduled("fireplace-crackle", (context, out, volume) => {
      const now = context.currentTime;
      if (Math.random() < 0.7) {
        const bufferSize = 0.05 * context.sampleRate;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        const src = context.createBufferSource();
        src.buffer = buffer;
        const hp = context.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1500;
        const g = context.createGain();
        g.gain.value = volume * (0.3 + Math.random() * 0.5);
        src.connect(hp);
        hp.connect(g);
        g.connect(out);
        src.start(now);
      }
      return 120 + Math.random() * 400;
    });
  }

  function start(id, volume) {
    if (active.has(id)) return;
    if (!BUILDERS[id]) return;
    const handle = BUILDERS[id]();
    handle.setVolume(volume);
    const extras = [];
    if (id === "fireplace") {
      extras.push(addFireplaceCrackle());
    }
    active.set(id, { handle, extras });
  }

  function stop(id) {
    const entry = active.get(id);
    if (!entry) return;
    entry.handle.stop();
    entry.extras.forEach((e) => e.stop());
    active.delete(id);
  }

  function setVolume(id, volume) {
    const entry = active.get(id);
    if (!entry) return;
    entry.handle.setVolume(volume);
    entry.extras.forEach((e) => e.setVolume(volume));
  }

  function stopAll() {
    Array.from(active.keys()).forEach(stop);
  }

  function playChime() {
    const context = getCtx();
    const now = context.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = context.createGain();
      const start = now + i * 0.18;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.25, start + 0.05);
      g.gain.linearRampToValueAtTime(0, start + 0.9);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(start);
      osc.stop(start + 1);
    });
  }

  return { getCtx, setMasterVolume, start, stop, setVolume, stopAll, playChime };
})();

/* ----------------------------------------------------------------------
 * Sound catalog
 * -------------------------------------------------------------------- */

const SOUNDS = [
  { id: "brown", label: "Brown Noise", icon: "🌊" },
  { id: "pink", label: "Pink Noise", icon: "🌸" },
  { id: "white", label: "White Noise", icon: "📺" },
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "ocean", label: "Ocean Waves", icon: "🏖️" },
  { id: "fan", label: "Fan / Wind", icon: "🌀" },
  { id: "fireplace", label: "Fireplace", icon: "🔥" },
  { id: "cafe", label: "Cafe Murmur", icon: "☕" },
  { id: "clock", label: "Clock Tick", icon: "⏰" },
];

/* ----------------------------------------------------------------------
 * App state + UI wiring
 * -------------------------------------------------------------------- */

const STATE_KEY = "focusboard.state.v1";
const PRESETS_KEY = "focusboard.presets.v1";
const THEME_KEY = "focusboard.theme.v1";

const state = {
  sounds: {}, // id -> { active: bool, volume: 0..1 }
  masterVolume: 0.7,
};

SOUNDS.forEach((s) => {
  state.sounds[s.id] = { active: false, volume: 0.6 };
});

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.masterVolume != null) state.masterVolume = saved.masterVolume;
    if (saved.sounds) {
      Object.keys(saved.sounds).forEach((id) => {
        if (state.sounds[id]) {
          state.sounds[id].volume = saved.sounds[id].volume ?? 0.6;
          // Don't auto-resume playback on load; browsers block autoplay
          // of audio contexts until a user gesture anyway.
        }
      });
    }
  } catch (e) {
    /* ignore corrupt state */
  }
}

function persistState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function savePresets(presets) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function buildSoundGrid() {
  const grid = document.getElementById("sound-grid");
  grid.innerHTML = "";

  SOUNDS.forEach((sound) => {
    const tile = document.createElement("div");
    tile.className = "sound-tile";
    tile.dataset.id = sound.id;
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("aria-pressed", "false");

    tile.innerHTML = `
      <div class="icon">${sound.icon}</div>
      <div class="label">${sound.label}</div>
      <input type="range" min="0" max="100" value="${Math.round(state.sounds[sound.id].volume * 100)}" aria-label="${sound.label} volume" />
    `;

    const slider = tile.querySelector("input[type=range]");

    function toggle() {
      const s = state.sounds[sound.id];
      s.active = !s.active;
      tile.classList.toggle("active", s.active);
      tile.setAttribute("aria-pressed", String(s.active));
      if (s.active) {
        AudioEngine.start(sound.id, s.volume);
      } else {
        AudioEngine.stop(sound.id);
      }
      persistState();
    }

    tile.addEventListener("click", (e) => {
      if (e.target === slider) return;
      toggle();
    });
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });

    slider.addEventListener("input", () => {
      const v = Number(slider.value) / 100;
      state.sounds[sound.id].volume = v;
      AudioEngine.setVolume(sound.id, v);
      persistState();
    });
    slider.addEventListener("click", (e) => e.stopPropagation());

    grid.appendChild(tile);
  });
}

function applyMixState(mix) {
  AudioEngine.stopAll();
  Object.keys(state.sounds).forEach((id) => {
    state.sounds[id].active = false;
    state.sounds[id].volume = mix[id]?.volume ?? state.sounds[id].volume;
  });
  Object.keys(mix).forEach((id) => {
    if (!state.sounds[id]) return;
    state.sounds[id].volume = mix[id].volume;
    state.sounds[id].active = mix[id].active;
  });
  document.querySelectorAll(".sound-tile").forEach((tile) => {
    const id = tile.dataset.id;
    const s = state.sounds[id];
    tile.classList.toggle("active", s.active);
    tile.setAttribute("aria-pressed", String(s.active));
    tile.querySelector("input[type=range]").value = Math.round(s.volume * 100);
    if (s.active) AudioEngine.start(id, s.volume);
  });
  persistState();
}

function renderPresets() {
  const list = document.getElementById("preset-list");
  const presets = loadPresets();
  list.innerHTML = "";

  if (presets.length === 0) {
    const li = document.createElement("li");
    li.className = "preset-empty";
    li.textContent = "No saved mixes yet.";
    list.appendChild(li);
    return;
  }

  presets.forEach((preset, index) => {
    const li = document.createElement("li");
    li.className = "preset-item";
    li.innerHTML = `
      <span class="preset-name">${escapeHtml(preset.name)}</span>
      <span class="preset-actions">
        <button class="load" title="Load">▶️</button>
        <button class="delete" title="Delete">🗑️</button>
      </span>
    `;
    li.querySelector(".load").addEventListener("click", () => {
      applyMixState(preset.sounds);
    });
    li.querySelector(".delete").addEventListener("click", () => {
      const updated = loadPresets();
      updated.splice(index, 1);
      savePresets(updated);
      renderPresets();
    });
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function wirePresetForm() {
  const nameInput = document.getElementById("preset-name");
  const saveBtn = document.getElementById("preset-save");

  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const presets = loadPresets();
    presets.push({ name, sounds: JSON.parse(JSON.stringify(state.sounds)) });
    savePresets(presets);
    nameInput.value = "";
    renderPresets();
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
  });
}

function wireMasterVolume() {
  const slider = document.getElementById("master-volume");
  slider.value = Math.round(state.masterVolume * 100);
  slider.addEventListener("input", () => {
    const v = Number(slider.value) / 100;
    state.masterVolume = v;
    AudioEngine.setMasterVolume(v);
    persistState();
  });
}

function wireStopAll() {
  document.getElementById("stop-all").addEventListener("click", () => {
    AudioEngine.stopAll();
    Object.keys(state.sounds).forEach((id) => (state.sounds[id].active = false));
    document.querySelectorAll(".sound-tile").forEach((tile) => {
      tile.classList.remove("active");
      tile.setAttribute("aria-pressed", "false");
    });
    persistState();
  });
}

function wireTheme() {
  const btn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  root.setAttribute("data-theme", saved);
  btn.textContent = saved === "dark" ? "🌙" : "☀️";

  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    btn.textContent = next === "dark" ? "🌙" : "☀️";
  });
}

/* ----------------------------------------------------------------------
 * Focus timer (Pomodoro-style)
 * -------------------------------------------------------------------- */

const Timer = (() => {
  let remaining = 25 * 60;
  let phase = "focus"; // "focus" | "break"
  let running = false;
  let intervalId = null;

  const display = document.getElementById("timer-display");
  const phaseLabel = document.getElementById("timer-phase");
  const startBtn = document.getElementById("timer-start");
  const resetBtn = document.getElementById("timer-reset");
  const focusInput = document.getElementById("focus-minutes");
  const breakInput = document.getElementById("break-minutes");
  const chimeCheckbox = document.getElementById("timer-chime");

  function format(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function render() {
    display.textContent = format(remaining);
    phaseLabel.textContent = phase === "focus" ? "Focus session" : "Break";
    startBtn.textContent = running ? "Pause" : "Start";
  }

  function tick() {
    remaining -= 1;
    if (remaining <= 0) {
      switchPhase();
    }
    render();
  }

  function switchPhase() {
    phase = phase === "focus" ? "break" : "focus";
    const minutes = phase === "focus" ? Number(focusInput.value) || 25 : Number(breakInput.value) || 5;
    remaining = minutes * 60;
    if (chimeCheckbox.checked) AudioEngine.playChime();
  }

  function start() {
    if (running) {
      pause();
      return;
    }
    running = true;
    intervalId = setInterval(tick, 1000);
    render();
  }

  function pause() {
    running = false;
    clearInterval(intervalId);
    render();
  }

  function reset() {
    running = false;
    clearInterval(intervalId);
    phase = "focus";
    remaining = (Number(focusInput.value) || 25) * 60;
    render();
  }

  function wire() {
    startBtn.addEventListener("click", start);
    resetBtn.addEventListener("click", reset);
    focusInput.addEventListener("change", () => {
      if (!running && phase === "focus") reset();
    });
    render();
  }

  return { wire };
})();

/* ----------------------------------------------------------------------
 * Init
 * -------------------------------------------------------------------- */

function init() {
  loadState();
  wireTheme();
  buildSoundGrid();
  wireMasterVolume();
  wireStopAll();
  wirePresetForm();
  renderPresets();
  Timer.wire();
}

document.addEventListener("DOMContentLoaded", init);
