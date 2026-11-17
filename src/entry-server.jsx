import { renderToString } from 'react-dom/server';
import App from './App.jsx';

// Build-time render of a route to HTML (scripts/prerender.mjs). The client hydrates this
// markup instead of replacing it, so the first paint is the finished, styled page.
export function render(url) {
  globalThis.__TW_SSR_URL__ = url;
  return renderToString(<App />);
}
