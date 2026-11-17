import { BEGINNER } from './beginner';
import { INTERMEDIATE } from './intermediate';
import { ADVANCED } from './advanced';

// The course: three levels, each a list of sections -> subsections -> concept headings,
// plus what a learner can build once a level is done.
//
// projects.real:  existing products you can now design end to end
// projects.hld:   architecture exercises to build and score in the simulator
//                 (problemId opens a ready-made problem; others are free builds)
// projects.lld:   class-level design exercises

export const LEVELS = [
  {
    id: 'beginner',
    name: 'Beginner',
    tone: 'signal',
    tagline: 'One request, end to end',
    sections: BEGINNER,
    projects: {
      real: [
        { name: 'Link shortener', like: 'Bitly, TinyURL', problemId: 'link-shortener' },
        { name: 'Paste and share text', like: 'Pastebin, GitHub Gist' },
        { name: 'Blog with a CDN', like: 'Medium, Ghost' },
        { name: 'Cached weather API', like: 'OpenWeather proxy' },
        { name: 'To-do API with accounts', like: 'Todoist backend' },
      ],
      hld: [
        { name: 'Put a cache in front of a read-heavy database' },
        { name: 'Scale a stateless API behind a load balancer' },
        { name: 'Serve a 20K req/s redirect service under 100 ms', problemId: 'link-shortener' },
        { name: 'Find the first component to saturate as traffic grows' },
      ],
      lld: ['Parking lot', 'Library management', 'Vending machine', 'Tic-tac-toe'],
    },
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    tone: 'warn',
    tagline: 'Many machines, many copies',
    sections: INTERMEDIATE,
    projects: {
      real: [
        { name: 'Group chat', like: 'WhatsApp, Slack', problemId: 'group-chat' },
        { name: 'Social home feed', like: 'X, Instagram', problemId: 'home-feed' },
        { name: 'Notification hub', like: 'Firebase Cloud Messaging', problemId: 'notifications' },
        { name: 'Public API with quotas', like: 'Stripe, GitHub API', problemId: 'public-api-quotas' },
        { name: 'File sync and sharing', like: 'Dropbox, Google Drive' },
        { name: 'Search-as-you-type', like: 'Google typeahead' },
      ],
      hld: [
        { name: 'Replicate a database and survive leader loss' },
        { name: 'Decouple fan-out with an event log and workers', problemId: 'home-feed' },
        { name: 'Stop a retry storm with a circuit breaker' },
        { name: 'Enforce per-key quotas across many servers', problemId: 'public-api-quotas' },
      ],
      lld: ['Elevator system', 'LRU cache', 'Rate limiter class', 'Expense splitter', 'Movie ticket booking', 'Logging framework'],
    },
  },
  {
    id: 'advanced',
    name: 'Advanced',
    tone: 'error',
    tagline: 'Correct, global, observable',
    sections: ADVANCED,
    projects: {
      real: [
        { name: 'Ride matching', like: 'Uber, Lyft', problemId: 'ride-matching' },
        { name: 'Video streaming', like: 'YouTube, Netflix', problemId: 'video-platform' },
        { name: 'Flash-sale checkout', like: 'Amazon Lightning Deals', problemId: 'flash-sale-checkout' },
        { name: 'Payment system', like: 'Stripe, UPI' },
        { name: 'Collaborative editor', like: 'Google Docs, Figma' },
        { name: 'Metrics and alerting', like: 'Prometheus, Datadog' },
        { name: 'Distributed job scheduler', like: 'Airflow, Temporal' },
      ],
      hld: [
        { name: 'Sell limited stock without overselling', problemId: 'flash-sale-checkout' },
        { name: 'Match riders and drivers with a geo index and locks', problemId: 'ride-matching' },
        { name: 'Keep video playback fast with CDN and origin shield', problemId: 'video-platform' },
        { name: 'Design for zero single points of failure, then run the chaos monkey' },
      ],
      lld: ['Consistent hashing ring', 'Distributed lock client', 'Event-sourced bank account', 'Saga orchestrator', 'Key-value store with a write-ahead log'],
    },
  },
];

export const SECTIONS = LEVELS.flatMap((level) => level.sections.map((s) => ({ ...s, level: level.id })));

export function sectionById(id) {
  return SECTIONS.find((s) => s.id === id) || null;
}

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || null;
}

export const COURSE_STATS = {
  sections: SECTIONS.length,
  subsections: SECTIONS.reduce((n, s) => n + s.subsections.length, 0),
  concepts: SECTIONS.reduce((n, s) => n + s.subsections.reduce((m, sub) => m + sub.concepts.length, 0), 0),
  projects: LEVELS.reduce((n, l) => n + l.projects.real.length + l.projects.hld.length + l.projects.lld.length, 0),
};
