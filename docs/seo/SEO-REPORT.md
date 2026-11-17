# SEO, GEO and AEO report: tracewire-nine.vercel.app

Audited and fixed on 2026-11-17 (Tracewire 1.1.0). Business type: free educational
web app (course plus browser tool). Scores below are from Lighthouse 12 (mobile
emulation) on the live site and from direct HTTP checks. No Google Search Console,
CrUX or GA4 data exists yet for this domain, so field data and rankings are not
measured.

## Before and after

| Check | Before (1.0.1) | After (1.1.0) |
|---|---|---|
| HTML a crawler without JavaScript receives | empty `<div id="root">` | full page content (lesson pages 420 to 690 words, roadmap 1,550) |
| Indexable URLs | 1 (all lessons behind `#/...`) | 22 (home, roadmap, simulator, 19 lessons) |
| Title and description | one for the whole site | unique per page, generated from course data |
| Canonical URLs | none | on every indexable page |
| Structured data | none | Organization, WebSite, Course with syllabus, FAQPage, WebApplication, LearningResource per lesson, BreadcrumbList, ItemList |
| `robots.txt`, `sitemap.xml` | returned the homepage HTML (soft 200) | real files; sitemap lists 22 URLs |
| Unknown URLs | 200 with the app shell (soft 404) | real 404 status with a 404 page |
| Social preview | text only | 1200x630 image, Open Graph and Twitter cards |
| AI assistants | nothing readable | full HTML, plus `llms.txt` and `llms-full.txt` (whole course as text) |
| Lighthouse SEO (home / lesson / roadmap) | 100 / not separately indexable | 100 / 100 / 100 |
| Lighthouse accessibility | 93 (home) | 100 / 100 / 100 |
| Lighthouse best practices | 100 | 100 / 100 / 100 |
| Lighthouse performance | 91 (home), 89 (lesson) | 89-99 (home, two runs), 98 (lesson), 99 (roadmap) |
| LCP (lab, mobile) | 3.1 s home, 3.3 s lesson | 1.8-3.4 s home, 1.9 s lesson, 1.5 s roadmap |
| CLS | 0 | 0 |

Lighthouse's SEO score was already 100 before because it only checks basics on the one
URL it loads. The real problems (empty HTML, one URL for the whole course, fake
robots/sitemap) are invisible to it, which is why the table leads with direct checks.

## What changed

1. **Real URLs.** `/roadmap`, `/learn/<lesson>`, `/learn/<lesson>/<part>`, `/sim`. Old
   `#/...` links upgrade in place. `/learn` redirects (308) to the first lesson.
2. **Prerendering** (`scripts/prerender.mjs`, runs in `npm run build`, so on Vercel too).
   Every route ships as static HTML with the same text the app renders; React then
   replaces it with the interactive page. Content parity holds, so this is not cloaking.
3. **Metadata from one source** (`src/seo/routes.js`), used by both the app and the
   prerender, so client navigation and static HTML always agree.
4. **Structured data** per page type (see table). FAQPage rich results are limited by
   Google to government and health sites, but the markup still describes the Q&A for
   other engines and assistants.
5. **Crawl controls.** `robots.txt` allows everything and names search and AI-search
   crawlers explicitly: Googlebot, Bingbot, OAI-SearchBot (ChatGPT Search), Claude-SearchBot,
   PerplexityBot, Applebot. Training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot)
   are allowed by the `*` rule; block them there if you prefer not to have the course
   used for model training. Doing so does not affect search or AI-search citations.
6. **`llms.txt` and `llms-full.txt`.** Google states these files do not help or hurt
   Google Search. They are there for other assistants and tools that read them.
7. **Performance.** Fonts load without blocking render; the landing page's interactive
   figures are split into their own chunks with fixed-size placeholders (main bundle
   345 KB to 279 KB, CLS stays 0).
8. **Answer-first content.** Every lesson opens with a direct explanation, has a
   "Concepts to learn" list, a worked example with numbers and a takeaway, and shows an
   updated date (also in `dateModified`).

## GEO readiness (AI search)

| Signal | Status |
|---|---|
| Server-rendered content | yes, all 22 pages |
| AI-search crawler access (OAI-SearchBot, Claude-SearchBot, PerplexityBot) | allowed, verified by fetching as each user agent (633 words, H1 and JSON-LD returned) |
| Citable passages | strong: definitions ("A cache keeps recent answers close..."), specific numbers (latency table, 85% hit rate maths, SLO error budget), self-contained worked examples |
| Structure | one H1 per page, H2 per lesson part, lists, ordered steps |
| Dates | visible and in structured data |
| Authorship | organization only; no named author yet |
| Brand mentions off-site | none yet (the biggest gap, see plan) |

Readiness was assessed against the criteria, not measured on ChatGPT, Perplexity or
Google AI Overviews (that needs a tool such as DataForSEO or SE Ranking).

## Plan: what to do next

### This week (needs your Google account)
1. **Google Search Console.** Add the property `https://tracewire-nine.vercel.app`
   (URL-prefix). Verify with the HTML-tag method: send me the `google-site-verification`
   meta tag and I will add it to `index.html`, or upload the HTML file Google gives you
   to `public/`. Then submit `https://tracewire-nine.vercel.app/sitemap.xml` and request
   indexing for `/`, `/roadmap` and two or three lessons.
2. **Bing Webmaster Tools.** Import the property from Search Console (one click). Bing
   also feeds ChatGPT Search and Copilot.
3. **Custom domain (recommended).** A domain such as `tracewire.dev` builds a durable
   brand; `*.vercel.app` URLs rank but are harder to remember and link to. If you add
   one, change `SITE_URL` in `src/seo/routes.js` and redeploy; Vercel redirects the old
   URL.

### Next two to four weeks (brand mentions drive AI citations)
4. Post the project where developers learn system design: r/systemdesign,
   r/learnprogramming, r/webdev (Show-and-tell rules), Hacker News "Show HN",
   dev.to and Hashnode articles built from the worked examples, and a LinkedIn post.
5. A short YouTube walkthrough (scale out the rack, break the database, watch the
   score). YouTube mentions correlate most strongly with AI citations in third-party
   studies (Ahrefs, 2025).
6. Submit to awesome lists on GitHub (awesome-system-design, awesome-scalability) and
   add GitHub topics to the repo (`system-design`, `system-design-interview`,
   `low-level-design`, `simulator`, `education`).

### Ongoing
7. Add a named author with a short bio and a LinkedIn or GitHub link on lesson pages
   (Person schema), once you are happy to publish your name there.
8. Refresh lessons and the `UPDATED` date regularly; content under three months old is
   cited more often in AI answers (SE Ranking study).
9. Ship the planned quizzes and more problems as new indexable pages (each problem
   could get its own `/problems/<id>` page with requirements and a reference design).
10. After Search Console has two to four weeks of data, review queries and impressions
    and tune titles for the terms people actually search.

## Target searches the pages are built for

system design course free · system design roadmap · learn system design ·
system design interview preparation · low level design · high level design ·
system design simulator · what is caching in system design · consistent hashing
explained · CAP theorem explained · database sharding explained · back of the
envelope estimation · saga pattern · circuit breaker pattern · rate limiter design ·
url shortener system design · chat system design · news feed system design.
