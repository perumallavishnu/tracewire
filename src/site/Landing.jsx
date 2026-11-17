import { LEVELS, COURSE_STATS } from '../course';
import LiveDial from './LiveDial';
import { SiteNav, Trace, TraceBullet } from './shared';
import { useReveal } from './siteUtils';
import Accordion from './Accordion';
import CountUp from './CountUp';
import { EventLog, InterviewTimer, KillRevive } from './BoardLive';
import RackFigure from './figure/RackFigure';
import BrokenToBuilt from './figure/BrokenToBuilt';
import './site.css';

const FAQ = [
  ['Is it free?', 'Yes. Tracewire is open source under the MIT licence. There is no account, no paywall and no server: everything runs in your browser.'],
  ['Who is it for?', 'Developers who want to understand how large systems are built, students preparing for system design interviews, and teachers who want a live whiteboard that pushes back.'],
  ['Do I need to know a lot already?', 'No. The beginner zone starts with what happens when you type a web address. If you can read a little code, you can follow every lesson.'],
  ['How is a design scored?', 'The scorer tests your design at the problem’s full peak load with a steady-state model: capacity per replica from Little’s law, queueing delay, critical-path p99 and single points of failure. It grades requirements, scalability, availability, latency and cost, 20 points each, and tells you how to fix every miss.'],
  ['Can the simulator really handle 100,000 requests a second?', 'The live run animates traffic at the rate a browser can draw, a few hundred requests a second. Scoring and the capacity planner calculate behaviour at full production scale instantly, using the same flow rules.'],
  ['Does it help with interviews?', 'Practice interview mode runs six timed phases, from clarifying requirements to the deep dive, and eight problems ship with reference designs to compare against once you have tried your own.'],
  ['What about low-level design?', 'Each zone lists class-design exercises such as a parking lot, an LRU cache or a saga orchestrator, and the intermediate zone has a full section on object modelling and design patterns.'],
  ['Can I contribute?', 'Please do. New problems, lessons and components are welcome on GitHub; the contributing guide explains how each is structured.'],
];

const MOSAIC = [
  { size: 'score', name: 'Scored at full load', line: 'The link shortener reference design: p99 61 ms against a 100 ms target.', ui: <div className="ui-score"><b><CountUp to={98} duration={1600} /></b><span>/100</span></div> },
  { size: 'tall', name: 'Replicas you can count', line: '5 app servers at 6,000 req/s each carry 20,000 with room to spare.', ui: <div className="ui-badge">×<CountUp to={5} from={1} duration={1200} delay={200} /></div> },
  { size: 'small', name: 'Hit rate changes everything', line: 'An 85% cache cuts database load from 19,780 to 2,964 req/s.', ui: <div className="ui-toggle"><span className="ui-toggle__track"><span /></span>Cache</div> },
  { size: 'wide', name: 'Find what breaks first', line: 'The capacity table shows each component’s load at peak.', ui: <div className="ui-util"><span className="ui-util__bar"><span /></span><b><CountUp to={309} duration={1800} delay={150} />%</b></div> },
  { size: 'small', name: 'Break it on purpose', line: 'Kill a node mid-run and watch the retries pile up.', ui: <KillRevive /> },
  { size: 'small', name: 'Interview on the clock', line: 'Six phases, from clarifying to the deep dive.', ui: <InterviewTimer /> },
];

export default function Landing() {
  const ref = useReveal();
  const levels = LEVELS;

  return (
    <div className="site" ref={ref}>
      <SiteNav />

      <section className="hero">
        <div className="hero__card">
          <Trace className="hero__trace" width={800} height={360} stroke={56} />
          <div className="hero__text">
            <h1 data-reveal>Design systems, then break them</h1>
            <p className="hero__lede" data-reveal>
              A free course from your first request to global scale, and a simulator where every design you draw meets real load, real failures and a 100-point score.
            </p>
            <div className="hero__actions" data-reveal>
              <a className="btn" href="#/roadmap">Start the roadmap</a>
              <a href="#/sim">Open the simulator</a>
              <a href="#/learn/how-the-web-works">Read lesson one</a>
            </div>
          </div>
        </div>
        <div className="hero__figure"><RackFigure /></div>
      </section>

      <section className="show" id="dial">
        <div className="show__head">
          <h2 data-reveal>20,000 requests, two designs</h2>
          <p className="statement" data-reveal>
            With an 85% cache the database sees about 3,000 requests a second. Remove the cache and it gets nearly 20,000, and two thirds of them fail. Move the dial and see for yourself.
          </p>
        </div>
        <div data-reveal><LiveDial /></div>
        <div className="show__actions" data-reveal>
          <a className="cell cell--ink" href="#/sim?problem=link-shortener">Build it in the simulator</a>
          <a className="cell" href="#/learn/caching-101">Read the caching lesson</a>
        </div>
      </section>

      <section className="steps">
        <div className="steps__head">
          <h2 data-reveal>From a pile of servers to a system</h2>
          <p data-reveal>Machines alone fall over. Four principles, applied in order, turn them into something that stays up: spread the load, cache the hot reads, replicate the data, queue the slow work.</p>
        </div>
        <div data-reveal><BrokenToBuilt /></div>
      </section>

      <section className="stats">
        <div className="stats__tile stats__tile--a" data-reveal>
          <b>{COURSE_STATS.subsections} lessons</b>
          <p>{COURSE_STATS.sections} sections across beginner, intermediate and advanced, with the {COURSE_STATS.concepts} concepts to learn named in each.</p>
        </div>
        <h2 className="stats__heading" data-reveal>What is inside</h2>
        <div className="stats__tile stats__tile--b" data-reveal>
          <b>39</b>
          <p>components in the simulator, from DNS to a distributed lock</p>
        </div>
        <div className="stats__tile stats__tile--c" data-reveal>
          <b>{COURSE_STATS.projects}</b>
          <p>projects: real products, simulator exercises and class designs</p>
        </div>
      </section>

      <section className="board">
        <div className="board__tile board__tile--head" data-reveal>
          <h2>Every number earns its place</h2>
        </div>
        {MOSAIC.map((t) => (
          <div key={t.name} className={`board__tile board__tile--${t.size}`} data-reveal>
            <div className="board__ui" data-ui>{t.ui}</div>
            <div className="board__caption">
              <h3>{t.name}</h3>
              <p>{t.line}</p>
            </div>
          </div>
        ))}
        <div className="board__tile board__tile--photo" data-reveal>
          <div className="board__logwrap" data-ui><EventLog /></div>
          <div className="board__caption">
            <h3>Every incident, logged</h3>
            <p>The event feed records each failure, retry and recovery as it happens.</p>
          </div>
        </div>
      </section>

      <section className="menu" id="roadmap-overview">
        <div className="menu__intro">
          <h2 data-reveal>The roadmap, zone by zone</h2>
          <p data-reveal>Each zone ends with what you can now build: real products, simulator exercises and class designs.</p>
          <a className="btn" href="#/roadmap" data-reveal>Open the zoomable roadmap</a>
        </div>
        {levels.map((level) => (
          <div key={level.id} className={`menu__level menu__level--${level.tone}`}>
            <div className="menu__level-head" data-reveal>
              <h3>{level.name}</h3>
              <span>{level.tagline}, {level.sections.length} sections</span>
            </div>
            <ul className="menu__items">
              {level.sections.map((s) => (
                <li key={s.id} data-reveal>
                  <TraceBullet tone={level.tone} />
                  <a href={`#/learn/${s.id}`}>
                    <span className="menu__name">{s.title}<span className="menu__count">{s.subsections.length} lessons</span></span>
                    <span className="menu__desc">{s.summary}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="menu__build" data-reveal>
              Then build: {level.projects.real.map((p) => `${p.name} (like ${p.like.split(',')[0]})`).join(', ')}.
            </p>
          </div>
        ))}
      </section>

      <section className="faq">
        <h2 data-reveal>Questions, answered</h2>
        <Accordion items={FAQ} />
      </section>

      <section className="close">
        <Trace className="close__trace" width={900} height={700} stroke={72} d="M -60 640 H 260 V 180 H 620 V 470 H 980" />
        <div className="close__text">
          <h2 data-reveal>Start with one request</h2>
          <p data-reveal>Lesson one follows a single request from your browser to a server and back. By the last zone you will be sizing systems for a whole planet.</p>
          <p className="close__fact" data-reveal>Free, open source, runs in your browser.</p>
          <a className="btn" href="#/learn/how-the-web-works" data-reveal>Begin lesson one</a>
        </div>
      </section>

      <footer className="foot">
        <div className="foot__mark" aria-label="Tracewire">
          {'TRACEWIRE'.split('').map((ch, i) => (
            <span key={i} style={{ height: `${[100, 72, 88, 64, 94, 78, 60, 86, 70][i]}%` }} aria-hidden="true">{ch}</span>
          ))}
        </div>
        <div className="foot__cols">
          <div>
            <h3>Learn</h3>
            <a href="#/roadmap">Roadmap</a>
            <a href="#/learn">Lessons</a>
            <a href="#/sim">Simulator</a>
          </div>
          <div>
            <h3>Project</h3>
            <a href="https://github.com/perumallavishnu/tracewire">Source on GitHub</a>
            <a href="https://github.com/perumallavishnu/tracewire/blob/main/CONTRIBUTING.md">Contributing</a>
            <a href="https://github.com/perumallavishnu/tracewire/issues">Report a bug</a>
          </div>
          <div className="foot__credits">
            <h3>Colophon</h3>
            <p>Isometric figures drawn with <a href="https://github.com/wheresryan22/anatomy">anatomy</a> (MIT). Icons from <a href="https://lucide.dev">Lucide</a> (ISC). Type set in Space Grotesk and Inter.</p>
          </div>
        </div>
        <div className="foot__last">
          <span>Tracewire is free software under the MIT licence.</span>
          <button type="button" className="btn btn--small" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>
        </div>
      </footer>
    </div>
  );
}
