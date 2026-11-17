import { useEffect, useState } from 'react';

// Path router on the History API: /roadmap, /learn/caching-101, /sim?problem=... Every route
// is also prerendered to static HTML at build time (scripts/prerender.mjs), so crawlers and
// first paint get real content and each lesson has its own indexable URL.
// Old #/... links from version 1.0 are rewritten to the matching path on load.

const NAV_EVENT = 'tw:navigate';

function upgradeHashUrl() {
  const { hash } = window.location;
  if (hash.startsWith('#/')) {
    window.history.replaceState(null, '', hash.slice(1) || '/');
  }
}

function parse() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  return { path, parts, query: new URLSearchParams(window.location.search) };
}

export function useRoute() {
  const [route, setRoute] = useState(() => {
    upgradeHashUrl();
    return parse();
  });
  useEffect(() => {
    const onChange = () => setRoute(parse());
    // an old #/... link followed within the page: upgrade it to the path, then route
    const onHash = () => {
      if (!window.location.hash.startsWith('#/')) return;
      upgradeHashUrl();
      onChange();
    };
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onHash);
    window.addEventListener(NAV_EVENT, onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener(NAV_EVENT, onChange);
    };
  }, []);
  return route;
}

export function navigate(to) {
  if (to === window.location.pathname + window.location.search) return;
  window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(NAV_EVENT));
}

// Same-origin <a href="/..."> clicks become client-side navigations. Modified clicks,
// new-tab targets, downloads and external links keep the browser's default behaviour.
export function useLinkInterception() {
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !a.getAttribute('href').startsWith('/')) return;
      e.preventDefault();
      navigate(url.pathname + url.search);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
