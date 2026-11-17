import { lazy, Suspense, useEffect } from 'react';
import { useRoute } from './router';
import { sectionById } from './course';
import Landing from './site/Landing';
import RouteSkeleton from './components/Skeleton';

// The simulator, roadmap canvas, lessons and 404 load on demand so the landing page stays light.
const SimulatorApp = lazy(() => import('./SimulatorApp'));
const Roadmap = lazy(() => import('./site/Roadmap'));
const Lesson = lazy(() => import('./site/Lesson'));
const NotFound = lazy(() => import('./site/NotFound'));

const TITLES = {
  '': 'Tracewire — learn system design by running it',
  roadmap: 'System design roadmap — Tracewire',
  learn: 'Lessons — Tracewire',
  sim: 'Simulator — Tracewire',
  missing: 'Page not found — Tracewire',
};

// Routes live in the hash, so any real path other than the root is a wrong address.
const onRealPath = () => !['/', '/index.html'].includes(window.location.pathname);

export default function App() {
  const route = useRoute();
  let page = route.parts[0] || '';
  const lessonMissing = page === 'learn' && route.parts[1] && !sectionById(route.parts[1]);
  if (onRealPath() || lessonMissing || !['', 'roadmap', 'learn', 'sim'].includes(page)) page = 'missing';

  useEffect(() => {
    document.title = TITLES[page];
    if (page !== 'learn') window.scrollTo(0, 0);
  }, [page]);

  let content;
  if (page === 'sim') content = <SimulatorApp problemId={route.query.get('problem')} />;
  else if (page === 'roadmap') content = <Roadmap />;
  else if (page === 'learn') content = <Lesson sectionId={route.parts[1]} subsectionId={route.parts[2]} />;
  else if (page === 'missing') content = <NotFound path={onRealPath() ? window.location.pathname : `#${route.path}`} />;
  else content = <Landing />;

  return <Suspense fallback={<RouteSkeleton page={page} />}>{content}</Suspense>;
}
