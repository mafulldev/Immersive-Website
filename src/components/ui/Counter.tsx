import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

interface CounterProps {
  value: number;
  suffix?: string;
  /** Texto final exato (ex.: "24/7"). Usado no fim da animação e no modo reduzido. */
  display: string;
  className?: string;
}

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** Contador com snap 1, 1,6 s, power3.out, formatado em pt-BR. Anima ao entrar na viewport. */
export function Counter({ value, suffix = '', display, className = '' }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion() || value === 0) {
        el.textContent = display;
        return;
      }
      const obj = { n: 0 };
      el.textContent = `0${suffix}`;
      gsap.to(obj, {
        n: value,
        duration: 1.6,
        ease: 'power3.out',
        snap: { n: 1 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          el.textContent = `${fmt.format(obj.n)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = display;
        },
      });
    },
    { scope: ref, dependencies: [value, suffix, display] },
  );

  return (
    <span ref={ref} className={`mono ${className}`.trim()}>
      {display}
    </span>
  );
}
