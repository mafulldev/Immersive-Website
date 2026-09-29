import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Ativa tilt 3D (máx. 5°) e spotlight que segue o cursor. */
  interactive?: boolean;
  as?: 'div' | 'article' | 'li';
  style?: CSSProperties;
}

const MAX_TILT = 5;

export function GlassCard({ children, className = '', interactive = false, as = 'div', style }: GlassCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const setters = useRef<{ rx: gsap.QuickToFunc; ry: gsap.QuickToFunc } | null>(null);

  const ensureSetters = () => {
    if (!ref.current) return null;
    if (!setters.current) {
      setters.current = {
        rx: gsap.quickTo(ref.current, 'rotationX', { duration: 0.5, ease: 'caudal' }),
        ry: gsap.quickTo(ref.current, 'rotationY', { duration: 0.5, ease: 'caudal' }),
      };
      gsap.set(ref.current, { transformPerspective: 900 });
    }
    return setters.current;
  };

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!interactive || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    const s = ensureSetters();
    if (!s || e.pointerType === 'touch') return;
    s.ry((px - 0.5) * 2 * MAX_TILT);
    s.rx(-(py - 0.5) * 2 * MAX_TILT);
  };

  const onLeave = () => {
    const s = setters.current;
    if (!s) return;
    s.rx(0);
    s.ry(0);
  };

  const Tag = as;
  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={`glass ${interactive ? 'card' : ''} ${className}`.trim()}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-card
    >
      {children}
    </Tag>
  );
}
