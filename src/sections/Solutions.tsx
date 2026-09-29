import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { gsap, Draggable, useGSAP } from '../lib/gsap';
import { onAnchorClick } from '../lib/anchors';
import { SOLUTIONS } from '../content/copy';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SplitHeading } from '../components/ui/SplitHeading';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { IconTile } from '../components/ui/IconTile';
import { Icon } from '../components/ui/Icon';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

const CARD_W = 220;
const GAP = 16;
const STEP = CARD_W + GAP;
const MAX_SKEW = 4;

export function Solutions() {
  const root = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggable = useRef<Draggable | null>(null);
  const [index, setIndex] = useState(0);
  const count = SOLUTIONS.cards.length;

  const minX = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return 0;
    return Math.min(0, vp.clientWidth - track.scrollWidth);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = gsap.utils.clamp(0, count - 1, i);
      const x = Math.max(minX(), -clamped * STEP);
      setIndex(clamped);
      gsap.to(track, {
        x,
        duration: prefersReducedMotion() ? 0 : 0.8,
        ease: 'caudal',
        onUpdate: () => draggable.current?.update(),
      });
    },
    [count, minX],
  );

  useGSAP(
    () => {
      const el = root.current;
      const track = trackRef.current;
      if (!el || !track) return;
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

      const cards = q('[data-card]');
      if (reduced) {
        gsap.from(cards, { opacity: 0, duration: 0.3, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
      } else {
        gsap.fromTo(
          cards,
          { clipPath: 'inset(100% 0 0 0)' },
          { clipPath: 'inset(0% 0 0 0)', duration: 1, stagger: 0.1, ease: 'caudal', scrollTrigger: { trigger: track, start: 'top 85%', once: true } },
        );
      }

      const snapX = (v: number) => gsap.utils.clamp(minX(), 0, Math.round(v / STEP) * STEP);
      const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3.out' });

      const [d] = Draggable.create(track, {
        type: 'x',
        bounds: { minX: minX(), maxX: 0 },
        inertia: true,
        edgeResistance: 0.75,
        throwResistance: 2500,
        snap: { x: snapX },
        onPress() {
          track.classList.add('is-dragging');
        },
        onDrag() {
          const v = gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, this.deltaX * 0.35);
          skewTo(v);
        },
        onRelease() {
          track.classList.remove('is-dragging');
          skewTo(0);
        },
        onThrowUpdate() {
          const i = Math.round(-this.x / STEP);
          setIndex(gsap.utils.clamp(0, count - 1, i));
        },
        onThrowComplete() {
          const i = Math.round(-this.x / STEP);
          setIndex(gsap.utils.clamp(0, count - 1, i));
        },
      });
      draggable.current = d;

      const onResize = () => d.applyBounds({ minX: minX(), maxX: 0 });
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        d.kill();
        draggable.current = null;
      };
    },
    { scope: root, dependencies: [count, minX] },
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = () => draggable.current?.update();
    track.addEventListener('transitionend', onWheel);
    return () => track.removeEventListener('transitionend', onWheel);
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <section ref={root} id="solucoes" className="section" aria-labelledby="solucoes-title">
      <div className="shell">
        <div className="grid-12 lg:items-center">
          <div className="pe scrim col-span-12 flex flex-col gap-5 lg:col-span-4">
            <div data-text-reveal>
              <Eyebrow>{SOLUTIONS.eyebrow}</Eyebrow>
            </div>
            <SplitHeading as="h2" id="solucoes-title" copy={SOLUTIONS.title} mode="scroll" />
            <p className="lead" data-text-reveal>
              {SOLUTIONS.body}
            </p>
            <div data-text-reveal>
              <Button variant="secondary" href={SOLUTIONS.buttonTarget} onClick={onAnchorClick}>
                {SOLUTIONS.button}
              </Button>
            </div>
          </div>

          <div className="pe col-span-12 lg:col-span-8">
            <div
              ref={viewportRef}
              className="carousel -mr-[var(--pad-x)] lg:-mr-[max(var(--pad-x),calc((100vw-var(--container))/2+var(--pad-x)))]"
              role="region"
              aria-roledescription="carrossel"
              aria-label={SOLUTIONS.carouselAria}
              tabIndex={0}
              onKeyDown={onKey}
            >
              <div ref={trackRef} className="carousel__track">
                {SOLUTIONS.cards.map((card, i) => (
                  <GlassCard
                    key={card.title}
                    as="article"
                    interactive
                    className="carousel__card"
                    style={{ opacity: 1 }}
                  >
                    <span className="sr-only">{`${i + 1} de ${count}`}</span>
                    <IconTile name={card.icon} />
                    <div className="mt-5 flex flex-col gap-2">
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-text">{card.text}</p>
                    </div>
                    <a href={SOLUTIONS.buttonTarget} className="link mt-auto text-[12px]" onClick={onAnchorClick} draggable={false}>
                      {SOLUTIONS.more}
                      <Icon name="ArrowRight" size={14} className="link__arrow" />
                    </a>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-6">
              <ol role="list" className="flex items-center gap-4" aria-label="Paginação">
                {SOLUTIONS.cards.map((c, i) => (
                  <li key={c.title}>
                    <button
                      type="button"
                      className="carousel__page"
                      aria-current={i === index ? 'true' : undefined}
                      aria-label={`${SOLUTIONS.carouselAria.split('.')[0]}: ${i + 1}`}
                      onClick={() => goTo(i)}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2">
                <button type="button" className="arrow-btn" aria-label={SOLUTIONS.prevAria} onClick={() => goTo(index - 1)} disabled={index === 0}>
                  <Icon name="ChevronLeft" size={16} />
                </button>
                <button type="button" className="arrow-btn" aria-label={SOLUTIONS.nextAria} onClick={() => goTo(index + 1)} disabled={index === count - 1}>
                  <Icon name="ChevronRight" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
