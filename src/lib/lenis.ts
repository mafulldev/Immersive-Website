import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from './gsap';
import { world } from '../store/world';

let lenis: Lenis | null = null;

/** Offset das âncoras: altura da nav. */
export const ANCHOR_OFFSET = -72;

export function initLenis(): Lenis {
  if (lenis) return lenis;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.2,
  });
  lenis.on('scroll', (e) => {
    ScrollTrigger.update();
    world.setState({ velocity: e.velocity });
  });
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function destroyLenis(): void {
  lenis?.destroy();
  lenis = null;
}

/** Rola até um alvo respeitando o offset da nav. Funciona com ou sem Lenis. */
export function scrollToTarget(target: string | HTMLElement, immediate = false): void {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: ANCHOR_OFFSET, duration: immediate ? 0 : 1.6 });
    return;
  }
  const top = el.getBoundingClientRect().top + window.scrollY + ANCHOR_OFFSET;
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}
