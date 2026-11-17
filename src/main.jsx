import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Markup rendered at build time is hydrated in place, but only on the route it was rendered
// for (data-ssr holds that path). A host fallback serving it for another URL, or an old #/...
// link that changes the route before the first render, gets a fresh render instead.
const path = window.location.pathname.replace(/\/+$/, '') || '/'
if (root.dataset.ssr === path && !window.location.hash.startsWith('#/')) {
  hydrateRoot(root, app)
} else {
  root.removeAttribute('data-ssr')
  createRoot(root).render(app)
}
