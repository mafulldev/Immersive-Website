import { Suspense, lazy, useEffect, useState } from 'react';
import { ScrollTrigger } from './lib/gsap';
import { createScrollSync } from './lib/scrollSync';
import { hasWebGL, useTier } from './hooks/useTier';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useWorld } from './store/world';
import { A11Y, NAV } from './content/copy';
import { Nav } from './components/layout/Nav';
import { SectionRail } from './components/layout/SectionRail';
import { Footer } from './components/layout/Footer';
import { CursorLight } from './components/ui/CursorLight';
import { SoundToggle } from './components/ui/SoundToggle';
import { Hero } from './sections/Hero';
import { Why } from './sections/Why';
import { Process } from './sections/Process';
import { Solutions } from './sections/Solutions';
import { Contact } from './sections/Contact';

/* O mundo 3D (three + R3F) é um chunk separado, importado após o primeiro paint. */
const World = lazy(() => import('./world/World'));

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export default function App() {
  const reduced = useReducedMotion();
  const [mountWorld, setMountWorld] = useState(false);
  const ready = useWorld((s) => s.ready);
  useTier();

  /* Carrega o mundo quando o navegador estiver ocioso, só com WebGL e sem reduced motion. */
  useEffect(() => {
    if (reduced || !hasWebGL()) {
      setMountWorld(false);
      return;
    }
    const w = window as IdleWindow;
    let id = 0;
    let timer = 0;
    const start = () => setMountWorld(true);
    if (w.requestIdleCallback) {
      id = w.requestIdleCallback(start, { timeout: 1200 });
    } else {
      timer = window.setTimeout(start, 300);
    }
    return () => {
      if (id && w.cancelIdleCallback) w.cancelIdleCallback(id);
      window.clearTimeout(timer);
    };
  }, [reduced]);

  /* ScrollTriggers na ordem do DOM; refresh após fontes. */
  useEffect(() => {
    const dispose = createScrollSync(!reduced);
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [reduced]);

  return (
    <>
      <a href="#conteudo" className="skip-link">
        {NAV.skipLink}
      </a>

      <div className="world-layer" aria-hidden="true">
        {mountWorld && (
          <Suspense fallback={null}>
            <World />
          </Suspense>
        )}
      </div>
      <div className={`poster ${ready ? 'is-hidden' : ''}`} role="img" aria-label={A11Y.posterAlt} />
      <CursorLight />

      <Nav />
      <SectionRail />

      <main id="conteudo" className="relative z-10">
        <Hero />
        <Why />
        <Process />
        <Solutions />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>

      <SoundToggle />
    </>
  );
}
