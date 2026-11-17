import { sectionById } from '../course';
import { problemById } from '../problems/problems';

// Learning paths through the course, and what is planned next. Planned items are labelled
// as planned: none of them ship in this version.

const PATHS = [
  {
    id: 'hld',
    name: 'High-level design',
    tone: 'signal',
    blurb: 'Draw systems that survive real traffic, from one server to many regions.',
    steps: [
      { lesson: 'how-the-web-works' },
      { lesson: 'scaling-basics' },
      { lesson: 'caching-101' },
      { lesson: 'data-at-scale' },
      { lesson: 'async' },
      { lesson: 'global-scale' },
      { problem: 'home-feed' },
    ],
  },
  {
    id: 'lld',
    name: 'Low-level design',
    tone: 'warn',
    blurb: 'Model the inside of one service so it stays easy to change.',
    steps: [
      { lesson: 'apis' },
      { lesson: 'databases-101' },
      { lesson: 'lld' },
      { lesson: 'transactions-distributed' },
      { text: 'Class designs: parking lot, LRU cache, rate limiter, expense splitter' },
    ],
  },
  {
    id: 'interview',
    name: 'Interview prep',
    tone: 'error',
    blurb: 'Practise the way interviews run: estimate, design, defend, under a clock.',
    steps: [
      { lesson: 'estimation' },
      { lesson: 'reliability' },
      { lesson: 'consistency' },
      { problem: 'link-shortener' },
      { problem: 'group-chat' },
      { problem: 'ride-matching' },
      { text: 'Practice interview mode: six timed phases, then Score' },
    ],
  },
];

const UPCOMING = [
  { when: 'Next', name: 'Progress tracking', text: 'Mark lessons done, see your progress through each zone, pick up where you left off.' },
  { when: 'Next', name: 'Quizzes per lesson', text: 'Five questions at the end of every lesson, with explanations for each answer.' },
  { when: 'Next', name: 'Twenty practice problems', text: 'Payments, collaborative editing, metrics, search, job scheduling and more, each with a reference design.' },
  { when: 'Later', name: 'Low-level design playground', text: 'Write class designs for the LLD exercises and check them against test scenarios in the browser.' },
  { when: 'Later', name: 'Chaos drills', text: 'Scripted incidents (a region outage, a hot key, a retry storm) with a goal and a score.' },
  { when: 'Later', name: 'Shareable designs', text: 'A link that opens your design, its score and its load test for a reviewer or an interviewer.' },
];

function Step({ step, index }) {
  if (step.lesson) {
    const s = sectionById(step.lesson);
    return <li><span className="path__n">{index + 1}</span><a href={`/learn/${s.id}`}>{s.title}</a><span className="path__kind">lesson</span></li>;
  }
  if (step.problem) {
    const p = problemById(step.problem);
    return <li><span className="path__n">{index + 1}</span><a href={`/sim?problem=${p.id}`}>{p.title}</a><span className="path__kind">problem</span></li>;
  }
  return <li><span className="path__n">{index + 1}</span><span>{step.text}</span><span className="path__kind">practice</span></li>;
}

export function LearningPaths() {
  return (
    <section className="paths" id="paths">
      <div className="paths__head">
        <h2 data-reveal>Three ways through it</h2>
        <p data-reveal>Follow the whole roadmap, or take the path that matches what you need right now.</p>
      </div>
      <div className="paths__grid">
        {PATHS.map((path) => (
          <article key={path.id} className={`path path--${path.tone}`} data-reveal>
            <h3>{path.name}</h3>
            <p>{path.blurb}</p>
            <ol className="path__steps">
              {path.steps.map((step, i) => <Step key={i} step={step} index={i} />)}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComingNext() {
  return (
    <section className="next" id="coming-next">
      <div className="next__head">
        <h2 data-reveal>Coming next</h2>
        <p data-reveal>Planned for the next releases. None of these ship in version 1.0; follow the GitHub repository to see them land.</p>
      </div>
      <ul className="next__list">
        {UPCOMING.map((u) => (
          <li key={u.name} className={`next__item next__item--${u.when.toLowerCase()}`} data-reveal>
            <span className="next__when">{u.when}</span>
            <h3>{u.name}</h3>
            <p>{u.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
