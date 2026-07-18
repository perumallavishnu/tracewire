# Tracewire — Setup & Execution Guide

This is a full local web application. Nothing is hosted for you — you run it on
your own machine with Node.js. This guide walks through everything from a bare
computer to a running simulator, plus troubleshooting.

---

## 1. Prerequisites

You need **Node.js 18 or newer** (Node 20 LTS recommended) and **npm** (comes
bundled with Node).

Check what you have installed by opening a terminal and running:

```bash
node -v
npm -v
```

- If `node -v` prints something like `v18.x.x` or `v20.x.x` — you're good, skip to step 2.
- If the command isn't found, or the version is older than 18, install Node.js:
  1. Go to https://nodejs.org
  2. Download the **LTS** version for your operating system (Windows/macOS/Linux).
  3. Run the installer, accepting the defaults.
  4. Re-open your terminal and re-run `node -v` to confirm.

No other software is required. You do not need a database, Docker, or any
paid account.

---

## 2. Get the project

Clone the repository:

```bash
git clone https://github.com/<your-username>/tracewire.git
cd tracewire
```

(If you instead downloaded a zip of the repo, unzip it anywhere and `cd`
into the extracted `tracewire/` folder.)

---

## 3. Install dependencies

Open a terminal and move into the project folder, then install packages:

```bash
cd path/to/tracewire
npm install
```

This downloads the libraries the app uses (React, React Flow for the diagram
canvas, Zustand for state, Recharts for the live charts) into a local
`node_modules` folder. It only needs internet access for this one step, and
only needs to be run once (re-run it only if you later delete `node_modules`
or change dependencies).

This typically takes 15–60 seconds depending on your connection.

---

## 4. Run it (development mode — recommended)

```bash
npm run dev
```

You'll see output like:

```
  VITE ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

Open that URL (`http://localhost:5173/`) in a modern browser (Chrome, Edge,
Firefox, or Safari). The simulator loads with an example architecture already
on the canvas.

To stop the server, go back to the terminal and press `Ctrl + C`.

Dev mode automatically reloads the page if you (or anyone) edits the source
code — you don't need to restart it while developing.

---

## 5. Run it as a production build (optional)

If you want an optimized, minified version (e.g. to deploy somewhere, or just
to run without the dev-server overhead):

```bash
npm run build
npm run preview
```

`npm run build` compiles everything into a `dist/` folder. `npm run preview`
serves that folder locally and prints a URL (usually
`http://localhost:4173/`) — open it the same way.

You can also deploy the contents of `dist/` to any static file host
(Netlify, Vercel, GitHub Pages, an S3 bucket, your own nginx, etc.) since it's
a fully client-side app with no backend/server component.

---

## 6. Using the app

- **Drag components onto the canvas** from the left palette (Traffic
  Generator, Load Balancer, Service, Database, Cache, Queue, CDN, Auth,
  Message Broker, Rate Limiter, Client). Drop them anywhere on the canvas.
- **Connect components** by dragging from the small dot on the right edge of
  one component to the dot on the left edge of another.
- **Click a component** to open the Inspector (right panel) and edit its
  behavior: capacity, latency, failure rate, queue size, cache hit rate,
  load-balancing algorithm, etc. Sliders update live, even while running.
- **Click a connection line** to edit its network latency, or sever it
  (simulates a network partition).
- **Press "▶ Run"** in the top toolbar to start the simulation. Watch teal
  pulses travel along the connections — that's live simulated traffic.
  Amber pulses are requests being retried.
- **Speed buttons** (0.5x–4x) speed up or slow down simulated time.
- **Chaos tools**: select a component and use the "Kill node", "Latency
  spike", or "Drop capacity" buttons in the Inspector, or select a connection
  and "Sever connection". Or turn on **Chaos monkey** (bottom-left over the
  canvas) to have the simulator randomly break things on its own — this is
  the best way to see cascading failures and retry storms happen live.
- **Bottom dock** shows live throughput, error rate, and latency percentile
  charts, plus a scrolling event log of every chaos incident and recovery.
- **"+ New custom component"** in the palette lets you define your own node
  type by toggling which behaviors it has (capacity limits, latency, random
  failures, queueing, cache-like hit rate) — it's then reusable like any
  built-in component.
- **Export / Import** (top-right of the toolbar) save or load your diagram as
  a `.json` file, so you can share architectures or keep several saved.
  Your last diagram is also auto-saved in the browser and reloads next time
  you open the app.
- **New** clears the canvas. **Load example** restores the starter
  architecture.

---

## 7. Troubleshooting

**"npm: command not found" or "node: command not found"**
Node.js isn't installed or isn't on your PATH. Reinstall from
https://nodejs.org and restart your terminal.

**Port 5173 (or 4173) is already in use**
Something else on your machine is using that port. Either close that other
program, or run on a different port:
```bash
npm run dev -- --port 5180
```

**Blank white page in the browser**
Open the browser's developer console (F12 or Ctrl+Shift+I / Cmd+Option+I) and
check the "Console" tab for a red error message. Make sure `npm install`
completed without errors first — if it didn't, delete `node_modules` and
`package-lock.json` and run `npm install` again.

**`npm install` fails with permission errors (macOS/Linux)**
Avoid using `sudo npm install`. Instead fix npm's permissions or use a Node
version manager like `nvm` (https://github.com/nvm-sh/nvm).

**Diagram doesn't persist after closing the tab**
The app saves to your browser's local storage. If you're in a private/
incognito window, or you clear site data, it won't persist — use Export to
save a `.json` copy you can Import later.

**I want to reset everything back to the example diagram**
Click "Load example" in the toolbar, or clear your browser's local storage
for the page and refresh.

---

## 8. Project structure (for reference)

```
tracewire/
├── index.html              Entry HTML
├── package.json             Dependencies & npm scripts
├── src/
│   ├── main.jsx              React entry point
│   ├── App.jsx               App shell & simulation loop
│   ├── styles/app.css        All styling (design tokens, layout, components)
│   ├── nodeDefs/             Built-in component definitions & field schemas
│   ├── simulation/engine.js  The simulation engine (traffic, capacity,
│   │                         retries, cascading failure, chaos injection)
│   ├── store/                Zustand stores (diagram graph, sim runtime)
│   ├── utils/edgePath.js     Connection-line geometry helper
│   └── components/           UI: Canvas, Palette, Inspector, Toolbar,
│                              Metrics dock, Chaos dock, Node builder modal
```
