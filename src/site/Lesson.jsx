import { useEffect, useState } from 'react';
import { LEVELS, SECTIONS, sectionById, levelById } from '../course';
import { problemById } from '../problems/problems';
import { EXAMPLES } from '../course/examples';
import { SiteNav, TraceBullet } from './shared';
import './site.css';
import './lesson.css';

function Sidebar({ current }) {
  return (
    <nav className="ls-side" aria-label="All sections">
      {LEVELS.map((level) => (
        <div key={level.id} className={`ls-side__level ls-side__level--${level.tone}`}>
          <h2>{level.name}</h2>
          <ul>
            {level.sections.map((s) => (
              <li key={s.id}>
                <a href={`#/learn/${s.id}`} aria-current={s.id === current.id ? 'page' : undefined}>{s.title}</a>
                {s.id === current.id && (
                  <ul className="ls-side__subs">
                    {s.subsections.map((sub) => (
                      <li key={sub.id}><a href={`#/learn/${s.id}/${sub.id}`}>{sub.title}</a></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function useActiveHeading(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export default function Lesson({ sectionId, subsectionId }) {
  const section = sectionById(sectionId) || SECTIONS[0];
  const level = levelById(section.level);
  const index = SECTIONS.findIndex((s) => s.id === section.id);
  const prev = SECTIONS[index - 1];
  const next = SECTIONS[index + 1];
  const subIds = section.subsections.map((s) => s.id);
  const active = useActiveHeading(subIds);
  const conceptCount = section.subsections.reduce((n, s) => n + s.concepts.length, 0);
  const practice = [...level.projects.real, ...level.projects.hld].filter((p) => p.problemId);
  const practiceUnique = practice.filter((p, i) => practice.findIndex((q) => q.problemId === p.problemId) === i).slice(0, 3);

  useEffect(() => {
    document.title = `${section.title} — Tracewire lessons`;
    if (subsectionId) {
      const el = document.getElementById(subsectionId);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [section.id, section.title, subsectionId]);

  return (
    <div className="site ls-page">
      <SiteNav current="learn" />
      <div className="ls-grid">
        <details className="ls-side-toggle">
          <summary>All sections</summary>
          <Sidebar current={section} />
        </details>
        <aside className="ls-side-wrap"><Sidebar current={section} /></aside>

        <article className={`ls-article ls-article--${level.tone}`}>
          <nav className="ls-crumbs" aria-label="Breadcrumb">
            <a href="#/roadmap">Roadmap</a>
            <span aria-hidden="true">/</span>
            <a href="#/roadmap">{level.name}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{section.title}</span>
          </nav>
          <h1>{section.title}</h1>
          <p className="ls-meta">{level.name} · {section.subsections.length} lessons · {conceptCount} concepts</p>
          <p className="ls-intro">{section.intro}</p>

          <div className="ls-contents">
            <h2>In this section</h2>
            <ul>
              {section.subsections.map((sub) => (
                <li key={sub.id}><TraceBullet tone={level.tone} /><a href={`#/learn/${section.id}/${sub.id}`}>{sub.title}</a></li>
              ))}
            </ul>
          </div>

          {section.subsections.map((sub) => (
            <section key={sub.id} id={sub.id} className="ls-sub">
              <h2>{sub.title}</h2>
              {sub.theory.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
              <div className="ls-concepts">
                <h3>Concepts to learn</h3>
                <ul>
                  {sub.concepts.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            </section>
          ))}

          {EXAMPLES[section.id] && (
            <section className="ls-example" id="worked-example">
              <h2>Worked example: {EXAMPLES[section.id].title}</h2>
              <p className="ls-example__scenario">{EXAMPLES[section.id].scenario}</p>
              <ol className="ls-example__steps">
                {EXAMPLES[section.id].steps.map((step) => <li key={step.slice(0, 32)}>{step}</li>)}
              </ol>
              {EXAMPLES[section.id].code && (
                <pre className="ls-example__code"><code>{EXAMPLES[section.id].code}</code></pre>
              )}
              <p className="ls-example__takeaway"><strong>Takeaway.</strong> {EXAMPLES[section.id].takeaway}</p>
            </section>
          )}

          <section className="ls-practice">
            <h2>Practise it</h2>
            <p>Open the simulator and build what you just read. These problems use the ideas from the {level.name.toLowerCase()} zone:</p>
            <ul>
              {practiceUnique.map((p) => (
                <li key={p.problemId}>
                  <a href={`#/sim?problem=${p.problemId}`}>{problemById(p.problemId)?.title}</a>
                  <span>{p.like ? `like ${p.like}` : p.name}</span>
                </li>
              ))}
              <li><a href="#/sim">Free build</a><span>start from an empty canvas</span></li>
            </ul>
          </section>

          {section.next.length > 0 && (
            <section className="ls-nextup">
              <h2>Where this leads</h2>
              <ul>
                {section.next.map((id) => {
                  const s = sectionById(id);
                  return (
                    <li key={id}><a href={`#/learn/${id}`}>{s.title}</a><span>{s.summary}</span></li>
                  );
                })}
              </ul>
            </section>
          )}

          <nav className="ls-pager" aria-label="Previous and next section">
            {prev ? <a href={`#/learn/${prev.id}`}><span>Previous</span>{prev.title}</a> : <span />}
            {next ? <a className="ls-pager__next" href={`#/learn/${next.id}`}><span>Next</span>{next.title}</a> : <a className="ls-pager__next" href="#/sim"><span>Finished</span>Build something</a>}
          </nav>
        </article>

        <aside className="ls-toc" aria-label="On this page">
          <h2>On this page</h2>
          <ul>
            {section.subsections.map((sub) => (
              <li key={sub.id}>
                <a href={`#/learn/${section.id}/${sub.id}`} aria-current={active === sub.id ? 'true' : undefined}>{sub.title}</a>
              </li>
            ))}
            {EXAMPLES[section.id] && (
              <li><a href={`#/learn/${section.id}/worked-example`}>Worked example</a></li>
            )}
          </ul>
          <a className="btn btn--small ls-toc__sim" href="#/sim">Open the simulator</a>
        </aside>
      </div>
    </div>
  );
}
