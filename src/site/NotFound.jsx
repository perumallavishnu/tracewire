import { SiteNav, Trace } from './shared';
import './site.css';

// Shown for any unknown route: a request that took a wrong turn and ended at a dead port.
export default function NotFound({ path }) {
  return (
    <div className="site nf-page">
      <SiteNav />
      <main className="nf">
        <div className="nf__text">
          <p className="nf__code" aria-hidden="true">404</p>
          <h1>This request took a wrong turn</h1>
          <p className="nf__lede">
            Nothing is listening at <code>{path || 'this address'}</code>. It may have moved, or the link may be mistyped.
          </p>
          <div className="nf__actions">
            <a className="btn" href="/">Back to the start</a>
            <a href="/roadmap">Open the roadmap</a>
            <a href="/learn/how-the-web-works">Browse lessons</a>
            <a href="/sim">Open the simulator</a>
          </div>
        </div>
        <div className="nf__art" aria-hidden="true">
          <Trace width={700} height={520} stroke={56} d="M -40 430 H 210 V 150 H 470 V 330" />
          <span className="nf__port" />
        </div>
      </main>
    </div>
  );
}
