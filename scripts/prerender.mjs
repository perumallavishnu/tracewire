// Build-time prerender (runs after `vite build`, on Vercel too): writes a static HTML file for
// every route with its own title, description, canonical, Open Graph tags, JSON-LD and the
// page's real content, so crawlers that do not run JavaScript (and first paint) see it.
// The landing page is React's own render, hydrated on load; the other pages ship a static
// version of the same content that React replaces with the interactive page.
// Also writes sitemap.xml, robots.txt, llms.txt, llms-full.txt and 404.html.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ALL_ROUTES, metaForRoute, NOT_FOUND_META, OG_IMAGE, REPO_URL, SITE_NAME, SITE_URL, UPDATED } from '../src/seo/routes.js';
import { LEVELS, SECTIONS, sectionById, levelById, COURSE_STATS } from '../src/course/index.js';
import { EXAMPLES } from '../src/course/examples.js';
import { PROBLEMS } from '../src/problems/problems.js';
import { FAQ } from '../src/site/faqData.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const template = readFileSync(join(DIST, 'index.html'), 'utf8');

// The landing page is rendered with React itself (dist-ssr, built by `vite build --ssr`) and
// hydrated on the client, so its first paint is the finished page, not plain text.
const { render } = await import(pathToFileURL(join(ROOT, 'dist-ssr', 'entry-server.js')).href);

// <link rel=modulepreload> for the hero rack's chunks, so they download alongside the main
// bundle instead of after it
const MANIFEST_FILE = join(DIST, '.vite', 'manifest.json');
function preloadTags(entry) {
  if (!existsSync(MANIFEST_FILE)) return '';
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
  const js = new Set();
  const css = new Set();
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || chunk.isEntry || js.has(chunk.file)) return;
    js.add(chunk.file);
    (chunk.css || []).forEach((f) => css.add(f));
    (chunk.imports || []).forEach(visit);
  };
  visit(entry);
  [...js].forEach((f) => { if (template.includes(f)) js.delete(f); });
  return [...[...css].map((f) => `<link rel="preload" as="style" crossorigin href="/${f}" />`), ...[...js].map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`)].join('\n    ');
}
const HERO_PRELOAD = preloadTags('src/site/figure/RackFigure.jsx');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path) => SITE_URL + (path === '/' ? '/' : path);

// ---------- structured data ----------
const ORG = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#org`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: [REPO_URL],
};
const COURSE = {
  '@type': 'Course',
  '@id': `${SITE_URL}/#course`,
  name: 'System Design: Beginner to Advanced (HLD and LLD)',
  description: `A free system design course: ${COURSE_STATS.sections} sections, ${COURSE_STATS.subsections} lessons and ${COURSE_STATS.concepts} concepts from how a single request works to global, multi-region systems, covering high-level and low-level design, with a simulator for practice.`,
  url: `${SITE_URL}/roadmap`,
  provider: { '@id': `${SITE_URL}/#org` },
  inLanguage: 'en',
  isAccessibleForFree: true,
  educationalLevel: 'Beginner to Advanced',
  teaches: SECTIONS.map((s) => s.title),
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' },
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT20H' },
  syllabusSections: SECTIONS.map((s) => ({ '@type': 'Syllabus', name: s.title, description: s.summary, url: `${SITE_URL}/learn/${s.id}` })),
};
const WEBAPP = {
  '@type': 'WebApplication',
  '@id': `${SITE_URL}/#simulator`,
  name: 'Tracewire System Design Simulator',
  url: `${SITE_URL}/sim`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any (runs in the browser)',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  featureList: '39 components, live traffic simulation, chaos injection, 100-point design scoring, capacity planning, eight practice problems, timed interview mode',
};
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });

// ---------- static page bodies (same content the app renders) ----------
const NAV = `<header class="pr-nav"><a href="/">Tracewire</a><nav><a href="/roadmap">Roadmap</a> <a href="/learn/${SECTIONS[0].id}">Lessons</a> <a href="/sim">Simulator</a> <a href="${REPO_URL}">GitHub</a></nav></header>`;
const FOOT = `<footer class="pr-foot"><p>Tracewire is free, open-source software under the MIT licence. <a href="${REPO_URL}">Source on GitHub</a>.</p></footer>`;
const sectionLink = (s) => `<a href="/learn/${s.id}">${esc(s.title)}</a>`;

function lessonBody(section) {
  const level = levelById(section.level);
  const i = SECTIONS.findIndex((s) => s.id === section.id);
  const prev = SECTIONS[i - 1];
  const next = SECTIONS[i + 1];
  const ex = EXAMPLES[section.id];
  const conceptCount = section.subsections.reduce((n, s) => n + s.concepts.length, 0);
  return `${NAV}<main>
  <nav aria-label="Breadcrumb"><a href="/roadmap">Roadmap</a> / <a href="/roadmap">${esc(level.name)}</a> / ${esc(section.title)}</nav>
  <article>
  <h1>${esc(section.title)}</h1>
  <p>${esc(level.name)} · ${section.subsections.length} lessons · ${conceptCount} concepts · Updated <time datetime="${UPDATED}">${UPDATED}</time></p>
  <p>${esc(section.intro)}</p>
  ${section.subsections.map((sub) => `
  <section id="${sub.id}"><h2>${esc(sub.title)}</h2>${sub.theory.map((p) => `<p>${esc(p)}</p>`).join('')}
  <h3>Concepts to learn</h3><ul>${sub.concepts.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>`).join('')}
  ${ex ? `<section id="worked-example"><h2>Worked example: ${esc(ex.title)}</h2><p>${esc(ex.scenario)}</p><ol>${ex.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${ex.code ? `<pre><code>${esc(ex.code)}</code></pre>` : ''}<p><strong>Takeaway.</strong> ${esc(ex.takeaway)}</p></section>` : ''}
  ${section.next.length ? `<section><h2>Where this leads</h2><ul>${section.next.map((id) => `<li>${sectionLink(sectionById(id))}: ${esc(sectionById(id).summary)}</li>`).join('')}</ul></section>` : ''}
  </article>
  <nav aria-label="Previous and next section">${prev ? `<a href="/learn/${prev.id}">Previous: ${esc(prev.title)}</a>` : ''} ${next ? `<a href="/learn/${next.id}">Next: ${esc(next.title)}</a>` : '<a href="/sim">Finished: build something</a>'}</nav>
  </main>${FOOT}`;
}

function roadmapBody() {
  return `${NAV}<main><h1>The system design roadmap</h1>
  <p>The whole course on one map: ${COURSE_STATS.sections} sections and ${COURSE_STATS.concepts} concepts across beginner, intermediate and advanced levels. Each level ends with real products to design, simulator exercises and class designs.</p>
  ${LEVELS.map((l) => `<section><h2>${esc(l.name)}: ${esc(l.tagline)}</h2>
    ${l.sections.map((s) => `<h3>${sectionLink(s)}</h3><p>${esc(s.summary)}</p><ul>${s.subsections.map((sub) => `<li><a href="/learn/${s.id}/${sub.id}">${esc(sub.title)}</a>: ${sub.concepts.map(esc).join(', ')}</li>`).join('')}</ul>`).join('')}
    <h3>After ${esc(l.name.toLowerCase())}, you can build</h3>
    <ul>${l.projects.real.map((p) => `<li>${esc(p.name)} (like ${esc(p.like)})${p.problemId ? `: <a href="/sim?problem=${p.problemId}">design it in the simulator</a>` : ''}</li>`).join('')}</ul>
    <p>Practice in the simulator (HLD): ${l.projects.hld.map((p) => esc(p.name)).join('; ')}.</p>
    <p>Class design (LLD): ${l.projects.lld.map(esc).join(', ')}.</p></section>`).join('')}
  </main>${FOOT}`;
}

function simBody() {
  return `${NAV}<main><h1>System design simulator</h1>
  <p>Drag components onto a canvas, connect them, and run live synthetic traffic through the architecture. Inject failures, size replicas with the capacity planner, and score the design out of 100 across requirements, scalability, availability, latency and cost. It runs entirely in your browser.</p>
  <h2>Practice problems</h2><ul>${PROBLEMS.map((p) => `<li><a href="/sim?problem=${p.id}">${esc(p.title)}</a> (${esc(p.difficulty)}): ${esc(p.summary)} Peak ${p.requirements.readQps + p.requirements.writeQps} requests per second, p99 target ${p.requirements.p99Ms} ms.</li>`).join('')}</ul>
  <noscript><p>The simulator needs JavaScript. The <a href="/roadmap">roadmap</a> and lessons work without it.</p></noscript>
  </main>${FOOT}`;
}

// ---------- page assembly ----------
const STATIC_CSS = `<style>.pr{max-width:820px;margin:0 auto;padding:24px 20px 64px;color:#e6edf3;background:#0b0e11;font:17px/1.6 Inter,system-ui,sans-serif}.pr a{color:#4fd1c5}.pr h1,.pr h2,.pr h3{font-family:'Space Grotesk',system-ui,sans-serif;line-height:1.15}.pr-nav,.pr-nav nav{display:flex;gap:16px;flex-wrap:wrap;align-items:baseline;justify-content:space-between}.pr pre{overflow:auto;background:#12161b;padding:12px}</style>`;

function page(meta, body, jsonld, { ssr = false, extraHead = '' } = {}) {
  const url = meta.path ? abs(meta.path) : null;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta property="og:[^"]+"[^>]*>/g, '');
  const head = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    url ? `<link rel="canonical" href="${url}" />` : '<meta name="robots" content="noindex" />',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '',
    ssr ? '' : STATIC_CSS,
    extraHead,
  ].filter(Boolean).join('\n    ');
  html = html.replace('</head>', `    ${head}\n  </head>`);
  // data-ssr names the route the markup was rendered for; the client hydrates only on that path
  if (ssr) return html.replace('<div id="root"></div>', `<div id="root" data-ssr="${meta.path}">${body}</div>`);
  return html.replace('<div id="root"></div>', `<div id="root"><div class="pr">${body}</div></div>`);
}

function write(path, html) {
  const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path.slice(1), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

for (const parts of ALL_ROUTES) {
  const meta = metaForRoute(parts);
  let body;
  let ld;
  let opts;
  if (parts.length === 0) {
    body = render('/');
    opts = { ssr: true, extraHead: HERO_PRELOAD };
    ld = graph(ORG, { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: SITE_NAME, url: `${SITE_URL}/`, publisher: { '@id': `${SITE_URL}/#org` }, inLanguage: 'en' }, COURSE, WEBAPP,
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  } else if (parts[0] === 'roadmap') {
    body = roadmapBody();
    ld = graph(crumbs([['Home', '/'], ['Roadmap', '/roadmap']]), { ...COURSE, url: `${SITE_URL}/roadmap` },
      { '@type': 'ItemList', name: 'System design roadmap', itemListElement: SECTIONS.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.title, url: `${SITE_URL}/learn/${s.id}` })) });
  } else if (parts[0] === 'sim') {
    body = simBody();
    ld = graph(crumbs([['Home', '/'], ['Simulator', '/sim']]), WEBAPP);
  } else {
    const s = sectionById(parts[1]);
    const level = levelById(s.level);
    body = lessonBody(s);
    ld = graph(
      crumbs([['Home', '/'], ['Roadmap', '/roadmap'], [s.title, `/learn/${s.id}`]]),
      {
        '@type': 'LearningResource',
        '@id': `${SITE_URL}/learn/${s.id}#lesson`,
        name: s.title,
        headline: `${s.title}: ${level.name} system design lesson`,
        description: meta.description,
        url: `${SITE_URL}/learn/${s.id}`,
        learningResourceType: 'Lesson',
        educationalLevel: level.name,
        inLanguage: 'en',
        isAccessibleForFree: true,
        dateModified: UPDATED,
        teaches: s.subsections.flatMap((sub) => sub.concepts),
        about: s.subsections.map((sub) => sub.title),
        isPartOf: { '@id': `${SITE_URL}/#course` },
        publisher: ORG,
      },
    );
  }
  write(meta.path, page(meta, body, ld, opts));
}

// 404: served by Vercel with a 404 status for any path that has no file
writeFileSync(join(DIST, '404.html'), page(NOT_FOUND_META, `${NAV}<main><h1>This request took a wrong turn</h1><p>Nothing is listening at this address. Try the <a href="/roadmap">roadmap</a>, the <a href="/learn/${SECTIONS[0].id}">first lesson</a> or the <a href="/sim">simulator</a>.</p></main>${FOOT}`, null));

// ---------- sitemap, robots, llms ----------
const urls = ALL_ROUTES.map((p) => metaForRoute(p).path);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${UPDATED}</lastmod></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(DIST, 'robots.txt'), `# Tracewire is a free, open-source course. Search engines and AI assistants are welcome.
User-agent: *
Allow: /

# Search and AI-search crawlers, named explicitly
User-agent: Googlebot
User-agent: Bingbot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Applebot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);

const llmsIndex = `# Tracewire

> Free, open-source system design course with a built-in simulator. ${COURSE_STATS.sections} sections, ${COURSE_STATS.subsections} lessons and ${COURSE_STATS.concepts} concepts covering high-level and low-level design from beginner to advanced, with a worked example in every section, eight practice problems with reference designs, and a simulator that load-tests and scores architectures. MIT licence.

## Course
- [System design roadmap](${SITE_URL}/roadmap): every section, lesson and concept on one map, by level
- [Full course text](${SITE_URL}/llms-full.txt): all lessons and worked examples as plain text
${LEVELS.map((l) => `\n## ${l.name} lessons\n${l.sections.map((s) => `- [${s.title}](${SITE_URL}/learn/${s.id}): ${s.summary}`).join('\n')}`).join('\n')}

## Simulator
- [System design simulator](${SITE_URL}/sim): drag components, run traffic, inject failures, get a 100-point score
${PROBLEMS.map((p) => `- [${p.title}](${SITE_URL}/sim?problem=${p.id}): ${p.summary}`).join('\n')}

## Project
- [Source code](${REPO_URL})
`;
writeFileSync(join(DIST, 'llms.txt'), llmsIndex);

const full = [`# Tracewire system design course (full text)\n\nSource: ${SITE_URL} · Updated ${UPDATED} · MIT licence\n`];
for (const l of LEVELS) {
  full.push(`\n# ${l.name}: ${l.tagline}\n`);
  for (const s of l.sections) {
    full.push(`\n## ${s.title}\n\nURL: ${SITE_URL}/learn/${s.id}\n\n${s.intro}\n`);
    for (const sub of s.subsections) full.push(`\n### ${sub.title}\n\n${sub.theory.join('\n\n')}\n\nConcepts: ${sub.concepts.join(', ')}.\n`);
    const ex = EXAMPLES[s.id];
    if (ex) full.push(`\n### Worked example: ${ex.title}\n\n${ex.scenario}\n\n${ex.steps.map((st, i) => `${i + 1}. ${st}`).join('\n')}\n${ex.code ? `\n\`\`\`\n${ex.code}\n\`\`\`\n` : ''}\nTakeaway: ${ex.takeaway}\n`);
  }
}
writeFileSync(join(DIST, 'llms-full.txt'), full.join(''));

// build-only artefacts: the manifest and the server bundle are not part of the site
rmSync(join(DIST, '.vite'), { recursive: true, force: true });

console.log(`prerendered ${ALL_ROUTES.length} pages, 404.html, sitemap.xml (${urls.length} urls), robots.txt, llms.txt, llms-full.txt`);
