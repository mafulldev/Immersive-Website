import { useEffect, type RefObject } from 'react';
import { gsap } from '../lib/gsap';
import { prefersReducedMotion } from './useReducedMotion';

interface MagneticOptions {
  radius: number;
  strength: number;
}

/** Puxa o elemento em direção ao cursor dentro de um raio. Só em ponteiros finos. */
export function useMagnetic(ref: RefObject<HTMLElement | null>, { radius, strength }: MagneticOptions): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const toX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'caudal' });
    const toY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'caudal' });
    let inside = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d < radius) {
        inside = true;
        toX(dx * strength);
        toY(dy * strength);
      } else if (inside) {
        inside = false;
        toX(0);
        toY(0);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, radius, strength]);
}
