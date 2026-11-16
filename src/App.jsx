import { lazy, Suspense, useEffect } from 'react';
import { useRoute } from './router';
import Landing from './site/Landing';

// The simulator, roadmap canvas and lessons load on demand so the landing page stays light.
const SimulatorApp = lazy(() => import('./SimulatorApp'));
const Roadmap = lazy(() => import('./site/Roadmap'));
const Lesson = lazy(() => import('./site/Lesson'));

const TITLES = {
  '': 'Tracewire — learn system design by running it',
  roadmap: 'System design roadmap — Tracewire',
  learn: 'Lessons — Tracewire',
  sim: 'Simulator — Tracewire',
};

export default function App() {
  const route = useRoute();
  const page = route.parts[0] || '';

  useEffect(() => {
    document.title = TITLES[page] || TITLES[''];
    if (page !== 'learn') window.scrollTo(0, 0);
  }, [page]);

  let content;
  if (page === 'sim') content = <SimulatorApp problemId={route.query.get('problem')} />;
  else if (page === 'roadmap') content = <Roadmap />;
  else if (page === 'learn') content = <Lesson sectionId={route.parts[1]} subsectionId={route.parts[2]} />;
  else content = <Landing />;

  return <Suspense fallback={<div className="route-loading" />}>{content}</Suspense>;
}
