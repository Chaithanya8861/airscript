# AirScript — Phase 1–3 starter

This is a working foundation for the project: camera → hand detection →
smoothed fingertip tracking → air drawing → a few rule-based gestures.
It does **not** yet include handwriting recognition, Firebase, or the
bonus features (virtual mouse, presentation controller, etc.) — that's
intentional. Get this rock solid first.

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`) and allow
camera access when prompted.

> Camera access requires a "secure context." `localhost` is exempt from
> needing HTTPS, but if you test on another device over your LAN, you'll
> need `vite --https` or a tunnel like ngrok.

## What's here

- `src/hooks/useHandTracking.js` — sets up the webcam and runs MediaPipe's
  `HandLandmarker` (the current Tasks Vision API — note this replaces the
  older `@mediapipe/hands` package that most tutorials still reference)
  on every frame via `requestAnimationFrame`. Returns the 21 landmarks of
  the first detected hand.
- `src/utils/smoothing.js` — an exponential moving average that turns
  jittery raw landmark coordinates into a stable line. Tune `alpha` in
  `AirCanvas.jsx` (currently 0.5) — lower = smoother but laggier.
- `src/utils/gestures.js` — rule-based gesture recognition using landmark
  geometry (distances/angles), no model needed. Recognizes `PEN`, `PEACE`,
  `THUMBS_UP`, `THUMBS_DOWN`, `OPEN_PALM`, `FIST`.
- `src/components/HandTracker.jsx` — renders the mirrored video feed, a
  debug skeleton overlay (so you can see what the model sees), and the
  current gesture/status readout.
- `src/components/AirCanvas.jsx` — the actual drawing layer. Draws while
  the `PEN` gesture (index finger only) is held; clears on `OPEN_PALM`.

## How the pen/gesture mechanic works

Instead of drawing continuously whenever a hand is visible (unusable —
you'd draw scribbles just moving your hand into frame), drawing is gated
behind a "pen pose": index finger extended, other fingers curled. That's
your pen-down state. Any other hand shape lifts the pen. This is a
placeholder mechanic — worth experimenting with alternatives, e.g. a
thumb-index pinch as pen-down instead, which some people find more
precise than holding a finger pose for a long stroke.

## Next steps (per the roadmap)

1. **Tune the smoothing** — try `alpha` values between 0.3 and 0.7 and
   see how it feels. Consider adding a dead-zone (ignore movement below
   some pixel threshold) to reduce drift while "holding still."
2. **Phase 5: air-writing recognition** — once a stroke is drawn, you need
   to capture the point sequence (not just render it) and either:
   - compare it against templates with something like the `$1 Unistroke
     Recognizer` algorithm (good for single letters, no training data
     needed), or
   - normalize/resample it and feed it to a pretrained handwriting model.
   Start with single uppercase letters before attempting cursive/words —
   air-written strokes are much messier than mouse/stylus input.
3. **Phase 4: Firebase** — save the point sequence (not the canvas pixels)
   so drawings are lightweight and re-renderable at any size. Debounce
   writes; don't save on every frame.
4. **Bonus features** — virtual mouse, presentation controller, and
   screenshot gestures all build directly on `recognizeGesture()` and
   `landmarks` — add new cases to `gestures.js` rather than new tracking
   pipelines.
