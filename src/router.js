import { useEffect, useState } from 'react';

// Minimal hash router: #/path/segments?query. Hash routing keeps the app a set
// of static files that any host (GitHub Pages included) can serve.

function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path: `/${parts.join('/')}`, parts, query: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function href(path) {
  return `#${path}`;
}

export function navigate(path) {
  window.location.hash = path;
}
