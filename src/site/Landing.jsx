import { useEffect, useState } from 'react';
import { LEVELS, COURSE_STATS } from '../course';
import LiveDial from './LiveDial';
import { SiteNav, Trace, TraceBullet } from './shared';
import { CREDITS, useReveal } from './siteUtils';
import './site.css';

const HERO_PICTURES = [
  { src: 'landing/switchboard-operator.jpg', alt: 'A soldier with a headset plugs cables into a field telephone switchboard in a dug-out, 1942', caption: '1942. An operator routes every call by hand. Routing requests is still the job.' },
  { src: 'landing/telephone-exchange.jpg', alt: 'A wooden 1940s telephone exchange with six line switches labelled ring, hold and night extension', caption: 'A 1940s exchange: six lines, and a hard limit on how many calls fit.' },
  { src: 'landing/arpanet-1977.png', alt: 'Hand-drawn logical map of the ARPANET in March 1977, showing linked computers at universities', caption: 'ARPANET, March 1977. A few dozen machines, already a distributed system.' },
  { src: 'landing/server-racks.jpg', alt: 'A row of server racks with blinking network equipment in a data centre', caption: 'Today: thousands of machines in one room, and any one can fail.' },
];

const STEPS = [
  { name: 'Learn', text: `${COURSE_STATS.concepts} concepts in ${COURSE_STATS.subsections} short lessons, ordered from one request to global scale.` },
  { name: 'Build', text: 'Drag 39 real components onto a canvas and wire them the way production systems are wired.' },
  { name: 'Prove', text: 'Run live traffic, inject failures, and get a 100-point score with a fix for every miss.' },
];

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
  { size: 'score', name: 'Scored at full load', line: 'The link shortener reference design: p99 61 ms against a 100 ms target.', ui: <div className="ui-score"><b>98</b><span>/100</span></div> },
  { size: 'tall', name: 'Replicas you can count', line: '5 app servers at 6,000 req/s each carry 20,000 with room to spare.', ui: <div className="ui-badge">×5</div> },
  { size: 'small', name: 'Hit rate changes everything', line: 'An 85% cache cuts database load from 19,780 to 2,964 req/s.', ui: <div className="ui-toggle"><span className="ui-toggle__track"><span /></span>Cache</div> },
  { size: 'wide', name: 'Find what breaks first', line: 'The capacity table shows each component’s load at peak.', ui: <div className="ui-util"><span className="ui-util__bar"><span /></span><b>309%</b></div> },
  { size: 'small', name: 'Break it on purpose', line: 'Kill a node mid-run and watch the retries pile up.', ui: <div className="ui-button">Revive node</div> },
  { size: 'small', name: 'Interview on the clock', line: 'Six phases, from clarifying to the deep dive.', ui: <div className="ui-timer">4:12<span> / 15:00</span></div> },
];

function HeroPictures() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer = setInterval(() => !document.hidden && setIndex((i) => (i + 1) % HERO_PICTURES.length), 5600);
    return () => clearInterval(timer);
  }, []);
  return (
    <figure className="hero__pictures">
      {HERO_PICTURES.map((p, i) => (
        <img key={p.src} src={p.src} alt={i === index ? p.alt : ''} aria-hidden={i !== index} className={i === index ? 'is-current' : ''} width="1600" height="1200" />
      ))}
      <figcaption>{HERO_PICTURES[index].caption}</figcaption>
    </figure>
  );
}

// Disorder, compression, order: concepts scattered, pulled into one design, released as a working system.
function ManyIntoOne() {
  const squares = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 48; i++) squares.push({ x: 10 + rand() * 300, y: 20 + rand() * 300, tone: rand() > 0.5 ? 'a' : 'b' });
  for (let i = 0; i < 48; i++) squares.push({ x: 360 + (i % 16) * 17, y: 147 + Math.floor(i / 16) * 17, tone: 'b' });
  for (let i = 0; i < 48; i++) squares.push({ x: 700 + (i % 8) * 37, y: 40 + Math.floor(i / 8) * 46, tone: 'c' });
  return (
    <svg className="many" viewBox="0 0 1000 340" role="img" aria-label="Scattered squares pulled into a tight ribbon, then released as ordered rows">
      {squares.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width="13" height="13" className={`many__sq many__sq--${s.tone}`} style={{ '--i': i }} />
      ))}
    </svg>
  );
}

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
        <HeroPictures />
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
          <h2 data-reveal>From notes to a working system</h2>
          <p data-reveal>Reading about load balancers is easy. Knowing where yours breaks takes practice, so every lesson ends on the canvas.</p>
        </div>
        <div data-reveal><ManyIntoOne /></div>
        <div className="steps__cols">
          {STEPS.map((s) => (
            <div key={s.name} data-reveal>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
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
        <figure className="board__tile board__tile--photo" data-reveal>
          <img src="landing/rack-cables.jpg" alt="The back of a data-centre rack, packed with network cables" loading="lazy" width="1200" height="1800" />
        </figure>
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
        <div className="faq__list">
          {FAQ.map(([q, a], i) => (
            <details key={q} name="faq" open={i === 0} data-reveal>
              <summary>{q}<span className="faq__plus" aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
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
            <h3>Pictures</h3>
            {CREDITS.map((c) => (
              <p key={c.file}><a href={c.url}>{c.title}</a>, {c.by}, {c.licence}, via Wikimedia Commons. Shown in grayscale.</p>
            ))}
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
