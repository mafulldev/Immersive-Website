import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { world } from '../../store/world';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Luz radial de 380px que segue o cursor (lerp .12, mix-blend screen).
 * Também alimenta o mouse normalizado no store do mundo (parallax e ondulação da água).
 */
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = prefersReducedMotion();
    if (!fine) {
      el.style.display = 'none';
      return;
    }
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    const setX = gsap.quickSetter(el, 'x', 'px');
    const setY = gsap.quickSetter(el, 'y', 'px');

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!reduced) {
        world.setState({
          mouse: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) },
        });
      }
    };
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      setX(pos.x);
      setY(pos.y);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.ticker.remove(tick);
    };
  }, []);

  return <div ref={ref} className="cursor-light" aria-hidden="true" />;
}
