# Feature comparison: SystemSim vs Tracewire

This compares Tracewire with [SystemSim](https://system-design-simulator.yashlunawat.com),
a hosted system-design interview simulator. We studied how it behaves from the
outside, using its UI and the publicly served page, to find features worth
adding. No SystemSim code, text or assets were copied. Tracewire's problems,
scoring rubric, trade-off notes, learn content and engine are written
independently.

## What SystemSim does (behavior, October 2026)

- **Component palette**: about 36 components in five categories (networking,
  compute, storage, messaging, infrastructure). Each has a max-QPS figure and
  a base latency.
- **Problems**: about 40 interview problems and "X vs Y" topics. Each has
  read/write QPS, storage, a latency SLA and DAU, plus a list of
  constraints, four staged hints, a reference solution and tags. Users can
  also create custom problems.
- **Simulate**: a static flow pass at a chosen load (light to stress
  presets). It propagates QPS through the graph and computes per-node
  utilization, latency inflation near saturation, bottlenecks and
  critical-path latency.
- **Score**: a rule-based rubric of five categories × 20 points
  (scalability, availability, latency, cost efficiency, trade-offs). Each
  check produces passed items or improvement feedback. Verdict bands run
  from "needs work" to "architect level".
- **Capacity / Trade-offs tabs**: an estimation helper (DAU → QPS, peak
  factor, bandwidth, storage) and per-component "when to use / when not to /
  key trade-offs" notes.
- **Practice interview**: a timed, phase-based flow (requirements,
  estimation, API, data model, high-level design, deep dive).
- **Also**: canvas notes, a reference/learn section, save/load/export, and
  keyboard navigation.

## Gap analysis

| Capability | Tracewire before | Tracewire now |
|---|---|---|
| Component library | 11 kinds | 39 kinds in 6 categories, searchable, with replicas |
| Live time-based simulation | ✅ (unique to Tracewire) | ✅, plus circuit breakers and cache hits that short-circuit |
| Chaos injection | ✅ (unique to Tracewire) | ✅ |
| Practice problems | — | 8 original problems with hints and reference designs |
| Steady-state load analysis | — | `analyze.js`: Little's law capacity, M/M/c queueing, p99 path, SPOFs |
| Design scoring | — | 100-point rubric: requirements, scalability, availability, latency, cost |
| Capacity planning | — | Estimator + per-component load table + right-size replicas |
| Trade-off notes | — | Gains, costs and alternatives for all 39 components |
| Interview mode | — | Six timed phases with prompts |
| Notes on canvas | — | Sticky notes, exported with the diagram |
| Learn / reference | — | 10 concept cards + 5 comparisons |
| Keyboard support | partial (React Flow defaults) | Delete, Esc, Space, S, Enter-to-add from palette |

## Where Tracewire deliberately differs

- **Two models instead of one.** SystemSim only does a static pass.
  Tracewire keeps its live, tick-based engine (retries, backpressure, chaos
  over time) and adds a steady-state model for scoring. Both follow the same
  flow rules, so Score and Run agree.
- **Scoring tests real load.** The rubric runs the design at the problem's
  peak QPS and grades errors, p99 against the SLA, saturation and missing
  architectural roles. It looks at more than which components are present.
- **SPOFs come from graph analysis.** A node is a single point of failure
  when it has one replica and losing it cuts traffic off from a sink.
  Managed services (DNS, CDN, cloud LBs, object storage) are treated as
  highly available.
- **Async work is off the latency path.** Anything reachable only through a
  queue doesn't count toward user-facing p99.

## Not adopted (yet)

- Custom user-defined problems
- "X vs Y" topics as scored problems (Tracewire covers them in the Learn
  drawer instead)
- Light/medium/heavy/stress load presets (Capacity takes any test load)
