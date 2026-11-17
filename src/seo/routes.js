import { LEVELS, SECTIONS, sectionById, levelById } from '../course';

// One source of truth for every page's title, description and canonical URL. The app sets
// these on navigation (useHead in App.jsx); scripts/prerender.mjs writes them into static HTML.

export const SITE_URL = 'https://tracewire-nine.vercel.app';
export const SITE_NAME = 'Tracewire';
export const OG_IMAGE = `${SITE_URL}/og.png`;
export const UPDATED = '2026-11-17';
export const REPO_URL = 'https://github.com/perumallavishnu/tracewire';
export const FIRST_LESSON = SECTIONS[0].id;

const totals = {
  lessons: SECTIONS.reduce((n, s) => n + s.subsections.length, 0),
  concepts: SECTIONS.reduce((n, s) => n + s.subsections.reduce((m, sub) => m + sub.concepts.length, 0), 0),
};

export function lessonMeta(section) {
  const level = levelById(section.level);
  return {
    title: `${section.title}: ${level.name} System Design | Tracewire`,
    description: `${section.summary} A free ${level.name.toLowerCase()} system design lesson: ${section.subsections.map((s) => s.title.toLowerCase()).join(', ')}, with a worked example and practice in the simulator.`.slice(0, 300),
    path: `/learn/${section.id}`,
  };
}

// route parts -> { title, description, path } or null for an unknown route
export function metaForRoute(parts) {
  const [page, id] = parts;
  if (!page) {
    return {
      title: 'Tracewire: Free System Design Course and Simulator (HLD + LLD)',
      description: `Learn system design free, from your first request to global scale: ${SECTIONS.length} sections, ${totals.lessons} lessons and worked examples covering high-level and low-level design, plus a simulator that load-tests and scores your architecture.`,
      path: '/',
    };
  }
  if (page === 'roadmap') {
    return {
      title: 'System Design Roadmap: Beginner to Advanced, HLD and LLD | Tracewire',
      description: `A zoomable system design roadmap: ${totals.concepts} concepts in ${SECTIONS.length} sections across beginner, intermediate and advanced levels, with real products, simulator exercises and class designs to build after each level.`,
      path: '/roadmap',
    };
  }
  if (page === 'learn') {
    const section = sectionById(id || FIRST_LESSON);
    return section ? lessonMeta(section) : null;
  }
  if (page === 'sim') {
    return {
      title: 'System Design Simulator: Build and Score Architectures | Tracewire',
      description: 'A free browser-based system design simulator: drag 39 components onto a canvas, run live traffic, inject failures, size replicas and get a 100-point score on eight practice problems.',
      path: '/sim',
    };
  }
  return null;
}

export const NOT_FOUND_META = {
  title: 'Page not found | Tracewire',
  description: 'This page does not exist. Browse the Tracewire system design roadmap and lessons instead.',
  path: null,
};

export const ALL_ROUTES = [[], ['roadmap'], ['sim'], ...SECTIONS.map((s) => ['learn', s.id])];
export { LEVELS, SECTIONS };
