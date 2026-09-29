import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { onAnchorClick } from '../lib/anchors';
import { BRAND, CONTACT } from '../content/copy';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SplitHeading } from '../components/ui/SplitHeading';
import { MagneticButton } from '../components/ui/MagneticButton';
import { GlassCard } from '../components/ui/GlassCard';
import { IconTile } from '../components/ui/IconTile';
import { Icon } from '../components/ui/Icon';
import { useMagnetic } from '../hooks/useMagnetic';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const orbitRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(orbitRef, { radius: 110, strength: 0.35 });

  useGSAP(
    () => {
      const el = root.current;
      const orbit = orbitRef.current;
      if (!el) return;
      const reduced = prefersReducedMotion();
      const q = gsap.utils.selector(el);

      gsap.from(q('[data-reveal]'), {
        y: reduced ? 0 : 20,
        opacity: 0,
        duration: reduced ? 0.3 : 1,
        stagger: 0.08,
        ease: reduced ? 'none' : 'caudal',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      });

      if (!orbit || reduced) return;
      const ring = orbit.querySelector<SVGCircleElement>('[data-ring]');
      const arrow = orbit.querySelector<HTMLElement>('[data-orbit-arrow]');
      if (!ring || !arrow) return;
      gsap.set(ring, { drawSVG: '0%' });

      const enter = () => {
        gsap.to(ring, { drawSVG: '0% 100%', duration: 0.6, ease: 'power2.inOut', overwrite: true });
        gsap
          .timeline({ overwrite: true })
          .to(arrow, { x: 40, opacity: 0, duration: 0.25, ease: 'power2.in' })
          .set(arrow, { x: -40 })
          .to(arrow, { x: 0, opacity: 1, duration: 0.35, ease: 'caudal' });
      };
      const leave = () => {
        gsap.to(ring, { drawSVG: '100% 100%', duration: 0.5, ease: 'power2.inOut', overwrite: true });
      };
      orbit.addEventListener('pointerenter', enter);
      orbit.addEventListener('pointerleave', leave);
      return () => {
        orbit.removeEventListener('pointerenter', enter);
        orbit.removeEventListener('pointerleave', leave);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="contato" className="section" aria-labelledby="contato-title">
      <div className="shell">
        <div className="grid-12 lg:items-center">
          <div className="pe scrim col-span-12 flex flex-col gap-5 lg:col-span-5">
            <div data-reveal>
              <Eyebrow>{CONTACT.eyebrow}</Eyebrow>
            </div>
            <SplitHeading as="h2" id="contato-title" copy={CONTACT.title} mode="scroll" />
            <p className="lead" data-reveal>
              {CONTACT.body}
            </p>
            <div data-reveal>
              <MagneticButton href={BRAND.ctaUrl} onClick={onAnchorClick}>
                {CONTACT.primary}
              </MagneticButton>
            </div>
          </div>

          <div className="pe col-span-12 sm:col-span-7 lg:col-span-3" data-reveal>
            <GlassCard className="glass--panel w-full max-w-[360px] p-5">
              <ul role="list" className="flex flex-col gap-4">
                {CONTACT.list.map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-[13px] text-text-1">
                    <IconTile name={item.icon} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          <div className="pe col-span-6 flex sm:col-span-2 lg:col-span-1 lg:justify-center" data-reveal>
            <a ref={orbitRef} href={BRAND.ctaUrl} className="orbit-btn" aria-label={CONTACT.orbitAria} onClick={onAnchorClick}>
              <svg className="ring" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                <circle data-ring cx="32" cy="32" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-90 32 32)" />
              </svg>
              <span data-orbit-arrow className="inline-flex">
                <Icon name="ArrowRight" size={20} />
              </span>
            </a>
          </div>

          <p className="pe scrim col-span-6 text-right text-[12px] leading-[1.6] text-text-2 sm:col-span-3 lg:col-span-3" data-reveal>
            {CONTACT.aside.map((line, i) => (
              <span key={line} className="block">
                {line}
                {i < CONTACT.aside.length - 1 ? '' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
