import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { initLenis } from './lib/lenis';
import { prefersReducedMotion } from './hooks/useReducedMotion';
import App from './App';

/* Com prefers-reduced-motion o scroll é nativo: sem Lenis. */
if (!prefersReducedMotion()) {
  initLenis();
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
