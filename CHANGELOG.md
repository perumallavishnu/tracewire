# Changelog

All notable changes to Tracewire. Versions follow [semantic versioning](https://semver.org).

## 1.1.1 — 2026-11-17

Faster first visit. Measured on a throttled connection (1.6 Mbps, 150 ms latency, 4x slower CPU, empty cache):

| Moment | 1.1.0 | 1.1.1 |
|---|---|---|
| Styled landing page on screen | 1.2 to 1.5 s (unstyled text first) | 0.74 s |
| Page interactive | 1.9 s | 1.0 s |
| Hero rack drawn | 1.95 s | 1.2 to 1.3 s |

### Changed
- The landing page is rendered with React at build time and hydrated, so the first paint is the finished, styled page instead of plain text that is later swapped out.
- The hero rack loads on its own: its code is preloaded alongside the main bundle, and an animated loader (server blades stacking into a rack) holds its exact place until it arrives, so nothing shifts.
- The dial and broken-to-built figures wait for the rack, so they never compete with it for bandwidth.

## 1.1.0 — 2026-11-17

Search and AI-search visibility.

### Added
- Real URLs for every page (`/roadmap`, `/learn/caching-101`, `/sim`) on the History API. Old `#/...` links from 1.0 redirect to the matching path.
- Build-time prerendering: every page ships as static HTML with its full content, so search engines and AI assistants that do not run JavaScript can read it.
- Unique title, description and canonical URL per page, Open Graph and Twitter cards, and a 1200x630 social image.
- Structured data (JSON-LD): Organization, WebSite, Course with syllabus, FAQPage, WebApplication, LearningResource for every lesson, BreadcrumbList and ItemList.
- `sitemap.xml`, `robots.txt` (search and AI-search crawlers allowed), `llms.txt` and `llms-full.txt` (the whole course as plain text).
- A real 404 status for unknown pages, security headers, and visible "Updated" dates on lessons.

## 1.0.1 — 2026-11-17

Responsive and spacing fixes, audited at 1440, 768 and 390 px on every page (landing, lessons, roadmap, 404, simulator): no overlapping text, no sideways overflow, tap targets of at least 24 px on phones.

### Fixed
- The event log tile on the landing page overlapped its caption; it now lays out in flow at every width.
- The simulator overflowed on tablets and phones. It now wraps its toolbar below 1280 px and becomes a single scrolling column below 900 px (canvas first, then components, inspector and metrics), with the minimap hidden on small screens.
- Phone tap targets: navigation, hero links and breadcrumbs are taller.
- The traffic dial's third control and third result no longer sit alone at half width on phones.

## 1.0.0 — 2026-11-17

The first release: a free system design course built around the simulator.

### Course
- 19 sections, 60 lessons and 255 named concepts across beginner, intermediate and advanced zones.
- A worked example with real numbers in every section, plus a code example for low-level design.
- Projects for every zone: real products to design, simulator exercises and class-design exercises.
- Lesson pages with a section tree, theory, concepts to learn, practice links into the simulator, a worked example, next and previous navigation, and an on-this-page rail.
- A zoomable roadmap of the whole course with level zones, linked sections and semantic zoom.
- Three learning paths on the landing page: high-level design, low-level design and interview prep.

### Landing page
- New logo and favicon.
- Fig 1: an isometric server rack you can drag to scale out (1 to 4 racks) and scale up (16 to 128 GB), driven by the scoring model.
- A traffic dial that shows the same 20,000 requests a second with and without a cache, computed live.
- An isometric scene of broken machines becoming a working architecture through four principles.
- Animated close-ups of the simulator, a "Coming next" list of planned features, and an FAQ.

### Simulator
- 39 components with icons, replicas and a circuit breaker; a resizable component panel.
- Eight practice problems with reference designs, a 100-point score, a capacity planner, trade-off notes and a timed interview mode.
- A steady-state model (`analyze.js`) for scoring and capacity at full production load.
- Chart axes with units, shown before the first run.
- A twelve-step guided tour that opens once for new visitors and replays from the Guide button.

### Site
- Loading skeletons for every lazily loaded page, a custom 404 page, and themed scrollbars.
- Ready for Vercel (`vercel.json`).

### Fixed
- The simulation loop crashed on the first frame after pressing Run (Recharts froze the history array).
- FAQ rows disappeared when one was opened.
