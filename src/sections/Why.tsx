import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { onAnchorClick } from '../lib/anchors';
import { WHY } from '../content/copy';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SplitHeading } from '../components/ui/SplitHeading';
import { GlassCard } from '../components/ui/GlassCard';
import { IconTile } from '../components/ui/IconTile';
import { Icon } from '../components/ui/Icon';
import { Counter } from '../components/ui/Counter';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

export function Why() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reduced = prefersReducedMotion();
      const q = gsap.utils.selector(el);

      gsap.from(q('[data-text-reveal]'), {
        y: reduced ? 0 : 16,
        opacity: 0,
        duration: reduced ? 0.3 : 0.9,
        stagger: 0.08,
        ease: reduced ? 'none' : 'caudal',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      });

      const cards = q<HTMLElement>('[data-card]');
      if (reduced) {
        gsap.from(cards, { opacity: 0, duration: 0.3, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
      } else {
        gsap.set(cards, { y: 40, opacity: 0, filter: 'blur(8px)' });
        ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.9,
              stagger: 0.08,
              ease: 'caudal',
              onStart: () => {
                batch.forEach((c, i) => {
                  window.setTimeout(() => c.classList.add('is-sweeping'), i * 80);
                });
              },
            });
          },
        });
      }

      gsap.from(q('[data-number]'), {
        y: reduced ? 0 : 16,
        opacity: 0,
        duration: reduced ? 0.3 : 0.9,
        stagger: 0.1,
        ease: reduced ? 'none' : 'caudal',
        scrollTrigger: { trigger: q('[data-numbers]')[0], start: 'top 85%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="porque" className="section" aria-labelledby="porque-title">
      <div className="shell">
        <div className="grid-12 lg:items-center">
          <div className="pe scrim col-span-12 flex flex-col gap-5 lg:col-span-5">
            <div data-text-reveal>
              <Eyebrow>{WHY.eyebrow}</Eyebrow>
            </div>
            <SplitHeading as="h2" id="porque-title" copy={WHY.title} mode="scroll" />
            <p className="lead" data-text-reveal>
              {WHY.body}
            </p>
            <a href={WHY.linkTarget} className="link" data-text-reveal onClick={onAnchorClick}>
              {WHY.link}
              <Icon name="ArrowRight" size={16} className="link__arrow" />
            </a>
          </div>

          <ul role="list" className="pe col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-6">
            {WHY.cards.map((card, i) => (
              <GlassCard
                key={card.title}
                as="li"
                interactive
                className={`flex min-h-[150px] flex-col gap-3 p-5 ${i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'} ${i === 3 ? 'lg:ml-6' : ''} ${i === 4 ? 'lg:mr-6' : ''}`}
              >
                <IconTile name={card.icon} />
                <div className="flex flex-col gap-1.5">
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-text">{card.text}</p>
                </div>
              </GlassCard>
            ))}
          </ul>

          <dl
            className="pe col-span-12 grid grid-cols-3 gap-6 border-t border-line pt-6 lg:col-span-2 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
            data-numbers
          >
            {WHY.numbers.map((n) => (
              <div key={n.label} className="flex flex-col gap-1" data-number>
                <dt className="sr-only">{n.label}</dt>
                <dd className="text-[28px] leading-none text-text-1">
                  <Counter value={n.value} suffix={n.suffix} display={n.display} />
                </dd>
                <dd className="text-[12px] leading-[1.4] text-text-2" aria-hidden="true">
                  {n.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
