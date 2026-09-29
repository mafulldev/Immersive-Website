import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { sections, sectionIndex, useSections } from '../../lib/sections';
import { SECTIONS } from '../../content/copy';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

/** Trilho fixo à esquerda: número atual (flip de slot), linha com progresso e "06". */
export function SectionRail() {
  const active = useSections((s) => s.active);
  const slotRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const prev = useRef(active);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    const set = gsap.quickSetter(fill, 'scaleY');
    const unsub = sections.subscribe((s) => set(s.progress));
    return unsub;
  }, []);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || prev.current === active) return;
    const from = sectionIndex(prev.current);
    const to = sectionIndex(active);
    prev.current = active;
    if (prefersReducedMotion()) {
      slot.textContent = to;
      return;
    }
    const inner = document.createElement('span');
    inner.className = 'flex flex-col';
    inner.innerHTML = `<span>${from}</span><span>${to}</span>`;
    slot.replaceChildren(inner);
    gsap.to(inner, {
      yPercent: -50,
      duration: 0.5,
      ease: 'caudal',
      onComplete: () => {
        slot.textContent = to;
      },
    });
  }, [active]);

  return (
    <div className="rail" aria-hidden="true">
      <span ref={slotRef} className="rail__slot mono">
        {sectionIndex(active)}
      </span>
      <span className="rail__line">
        <span ref={fillRef} className="rail__fill" />
      </span>
      <span className="rail__end mono">{SECTIONS[SECTIONS.length - 1].index}</span>
    </div>
  );
}
