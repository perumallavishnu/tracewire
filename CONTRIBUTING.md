# Contributing to Tracewire

Thanks for considering a contribution. This project is small on purpose —
please keep changes focused and readable.

## Getting set up

```bash
git clone https://github.com/<your-username>/tracewire.git
cd tracewire
npm install
npm run dev
```

See `README.md` for full setup instructions and `SETUP.md` for a more
detailed walkthrough and troubleshooting.

## Workflow

1. Open an issue first for anything non-trivial (new component types, engine
   behavior changes, UI redesigns) so we can agree on the approach before
   you put time into it. Small fixes and typos can just go straight to a PR.
2. Fork the repo and branch off `main`:
   ```bash
   git checkout -b fix/short-description
   ```
3. Make your changes, following the conventions below.
4. Test locally: run `npm run dev` and click through the affected feature.
   If you touched the simulation engine, it's worth writing a throwaway
   Node script that imports `src/simulation/engine.js` directly and runs a
   few hundred ticks to sanity-check behavior before opening a PR.
5. Run the linter: `npm run lint`
6. Open a pull request against `main`. Describe what changed, why, and how
   you tested it. Screenshots/GIFs are appreciated for UI changes.

## Project conventions

- **No new heavy dependencies without discussion.** The project intentionally
  stays small (React, Vite, @xyflow/react, Zustand, Recharts). If a feature
  seems to need a new dependency, open an issue first.
- **Simulation logic lives in `src/simulation/engine.js` only.** UI
  components should read from the engine's snapshot, not duplicate
  simulation math.
- **New built-in component types** go in `src/nodeDefs/nodeTypes.js`
  (defaults) and `src/nodeDefs/fieldSchemas.js` (which fields the Inspector
  exposes), then need a corresponding branch in
  `SimulationEngine._processAtNode()` if their behavior isn't already
  covered by the generic capacity/latency/failure/queue/cache logic.
- **New chaos effects** should follow the existing pattern in
  `engine.js`: an `activeEffects` entry with a `type`, `targetId`, and
  `expiresAt`, applied in `_effectiveConfig()` and cleaned up in
  `_expireEffects()`.
- **Styling** uses plain CSS with custom properties defined in
  `src/styles/app.css` — no CSS framework. Keep new styles consistent with
  the existing color/spacing tokens at the top of that file.
- Keep pull requests scoped to one concern. Large multi-feature PRs are
  harder to review and more likely to stall.

## Reporting bugs

Please include:
- Steps to reproduce
- What you expected vs. what happened
- Your browser and OS
- If possible, export your diagram (toolbar → Export) and attach the JSON

Open bugs and feature requests as
[GitHub Issues](https://github.com/<your-username>/tracewire/issues).

## Code of conduct

Be respectful and constructive in issues, PRs, and discussions. Disagreement
about technical approaches is fine and expected — personal attacks aren't.
