import { lazy, Suspense, useEffect } from 'react';
import { useLinkInterception, useRoute } from './router';
import { metaForRoute, NOT_FOUND_META, SITE_URL } from './seo/routes';
import Landing from './site/Landing';
import RouteSkeleton from './components/Skeleton';

// The simulator, roadmap canvas, lessons and 404 load on demand so the landing page stays light.
const SimulatorApp = lazy(() => import('./SimulatorApp'));
const Roadmap = lazy(() => import('./site/Roadmap'));
const Lesson = lazy(() => import('./site/Lesson'));
const NotFound = lazy(() => import('./site/NotFound'));

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/);
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

// keeps title, description, canonical and Open Graph in step with the route
function useHead(meta) {
  useEffect(() => {
    document.title = meta.title;
    const url = meta.path ? SITE_URL + (meta.path === '/' ? '/' : meta.path) : null;
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[name="robots"]', 'content', meta.path ? null : 'noindex');
  }, [meta]);
}

export default function App() {
  const route = useRoute();
  useLinkInterception();
  const meta = metaForRoute(route.parts) || NOT_FOUND_META;
  const page = meta === NOT_FOUND_META ? 'missing' : route.parts[0] || '';
  useHead(meta);

  useEffect(() => {
    if (page !== 'learn') window.scrollTo(0, 0);
  }, [page, route.path]);

  let content;
  if (page === 'sim') content = <SimulatorApp problemId={route.query.get('problem')} />;
  else if (page === 'roadmap') content = <Roadmap />;
  else if (page === 'learn') content = <Lesson sectionId={route.parts[1]} subsectionId={route.parts[2]} />;
  else if (page === 'missing') content = <NotFound path={route.path} />;
  else content = <Landing />;

  return <Suspense fallback={<RouteSkeleton page={page} />}>{content}</Suspense>;
}
