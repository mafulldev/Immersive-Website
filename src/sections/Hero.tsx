import { useEffect, useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../lib/gsap';
import { onAnchorClick } from '../lib/anchors';
import { useSections } from '../lib/sections';
import { BRAND, HERO } from '../content/copy';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SplitHeading } from '../components/ui/SplitHeading';
import { MagneticButton } from '../components/ui/MagneticButton';
import { Button } from '../components/ui/Button';
import { IconTile } from '../components/ui/IconTile';
import { Icon } from '../components/ui/Icon';
import { GlassCard } from '../components/ui/GlassCard';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

const fmt = new Intl.NumberFormat('pt-BR');

function sparkPath(values: readonly number[], w: number, h: number): { line: string; area: string; points: Array<[number, number]> } {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = 4;
  const pts: Array<[number, number]> = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`;
  return { line, area, points: pts };
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef<HTMLSpanElement>(null);
  const reviewedRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const scrolled = useSections((s) => s.scrolled);
  const spark = sparkPath(HERO.hud.sparkline, 240, 48);
  const glowPoints = [spark.points[Math.floor(spark.points.length * 0.35)], spark.points[Math.floor(spark.points.length * 0.7)], spark.points[spark.points.length - 1]];

  /* HUD: contador de linhas geradas; "revisadas" persegue com 400 ms de atraso. */
  useEffect(() => {
    const gen = generatedRef.current;
    const rev = reviewedRef.current;
    if (!gen || !rev) return;
    const reduced = prefersReducedMotion();
    let generated = HERO.hud.generatedStart;
    let reviewed = HERO.hud.generatedStart;
    const paint = () => {
      gen.textContent = fmt.format(generated);
      rev.textContent = `${fmt.format(reviewed)}/${fmt.format(generated)}`;
    };
    paint();
    if (reduced) return;
    let timeout = 0;
    const interval = window.setInterval(() => {
      const delta = HERO.hud.tickMin + Math.floor(Math.random() * (HERO.hud.tickMax - HERO.hud.tickMin + 1));
      generated += delta;
      paint();
      timeout = window.setTimeout(() => {
        reviewed = generated;
        paint();
      }, HERO.hud.reviewDelayMs);
    }, HERO.hud.tickMs);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  /* Intro (máx. 2 s) + saída em parallax. */
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reduced = prefersReducedMotion();
      const q = gsap.utils.selector(el);
      const eyebrow = q<HTMLElement>('[data-eyebrow]')[0];
      const lead = q<HTMLElement>('[data-lead]')[0];
      const buttons = q('[data-buttons] > *');
      const highlights = q('[data-highlight]');
      const hud = hudRef.current;
      const sparkLine = q<SVGPathElement>('[data-spark-line]')[0];
      const sparkArea = q<SVGPathElement>('[data-spark-area]')[0];
      const sparkDots = q('[data-spark-dot]');

      if (reduced) {
        gsap.from([lead, ...buttons, ...highlights, hud], { opacity: 0, duration: 0.3, stagger: 0.05, ease: 'none' });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'caudal' } });
      tl.to(eyebrow, { duration: 0.8, scrambleText: { text: HERO.eyebrow, chars: HERO.scrambleChars, speed: 0.5 } }, 0.1);

      const leadSplit = SplitText.create(lead, { type: 'lines', linesClass: 'lead-line' });
      tl.from(leadSplit.lines, { y: 12, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.55);
      tl.from(buttons, { scale: 0.96, opacity: 0, duration: 0.7, transformOrigin: '50% 50%' }, 0.7);
      tl.from(highlights, { y: 10, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.85);
      if (hud) {
        tl.fromTo(hud, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9 }, 0.9);
      }
      if (sparkLine) tl.fromTo(sparkLine, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'power2.inOut' }, 0.9);
      if (sparkArea) tl.from(sparkArea, { opacity: 0, duration: 1.2 }, 1.1);
      tl.from(sparkDots, { scale: 0, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.1 }, 1.7);

      /* Saída do hero com scrub: profundidade por parallax. */
      const h1 = q<HTMLElement>('h1')[0];
      const exit = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      });
      exit.to(h1, { y: -80, opacity: 0.2, ease: 'none' }, 0);
      if (hud) exit.to(hud, { y: -140, ease: 'none' }, 0);

      /* Seta do "Role para descobrir": desliza 6px a cada 2,4 s. */
      const arrow = q('[data-cue-arrow]')[0];
      if (arrow) {
        gsap.to(arrow, { y: 6, duration: 0.6, ease: 'power1.inOut', yoyo: true, repeat: -1, repeatDelay: 1.2 });
      }

      return () => leadSplit.revert();
    },
    { scope: root },
  );

  useEffect(() => {
    const cue = cueRef.current;
    if (!cue || !scrolled) return;
    gsap.to(cue, { opacity: 0, y: 8, duration: 0.5, ease: 'caudal', onComplete: () => gsap.set(cue, { visibility: 'hidden' }) });
  }, [scrolled]);

  return (
    <section ref={root} id="inicio" className="section section--hero" aria-labelledby="hero-title">
      <div className="shell relative">
        <div className="grid-12 lg:min-h-[calc(100svh-var(--nav-h)-96px)] lg:items-center">
          <div className="pe scrim col-span-12 flex flex-col gap-6 lg:col-span-6 lg:-translate-y-[6%]">
            <Eyebrow>{HERO.eyebrow}</Eyebrow>
            <SplitHeading as="h1" id="hero-title" copy={HERO.title} mode="intro" delay={0.2} sheen className="hero-h1" />
            <p className="lead" data-lead>
              {HERO.lead}
            </p>
            <div className="flex flex-wrap items-center gap-3" data-buttons>
              <MagneticButton href={BRAND.ctaUrl} onClick={onAnchorClick}>
                {HERO.primary}
              </MagneticButton>
              <Button variant="secondary" href={HERO.secondaryTarget} onClick={onAnchorClick}>
                {HERO.secondary}
              </Button>
            </div>
            <ul role="list" className="mt-2 flex flex-wrap gap-x-8 gap-y-4">
              {HERO.highlights.map((h) => (
                <li key={h.lines[0]} className="flex items-center gap-3" data-highlight>
                  <IconTile name={h.icon} />
                  <span className="text-[12px] leading-[1.35] text-text-2">
                    {h.lines[0]}
                    <br />
                    {h.lines[1]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            ref={hudRef}
            className="pe col-span-12 flex flex-col gap-3 sm:flex-row lg:absolute lg:right-0 lg:top-[48px] lg:w-[300px] lg:flex-col"
            data-hud
          >
            <GlassCard className="glass--panel flex-1 p-5">
              <p className="hud-eyebrow">
                <span className="dot-live" aria-hidden="true" />
                {HERO.hud.eyebrow}
              </p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <span ref={generatedRef} className="mono block text-[30px] leading-none text-text-1">
                    {fmt.format(HERO.hud.generatedStart)}
                  </span>
                  <span className="mt-2 block text-[12px] text-text-2">{HERO.hud.generatedLabel}</span>
                </div>
                <span className="chip chip--ok">{HERO.hud.rate}</span>
              </div>
              <svg
                className="mt-4 block w-full"
                viewBox="0 0 240 48"
                width={240}
                height={48}
                role="img"
                aria-label={HERO.hud.sparklineAria}
              >
                <defs>
                  <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2E9BFF" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#2E9BFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={spark.area} fill="url(#spark-fill)" data-spark-area />
                <path d={spark.line} fill="none" stroke="#7CC6FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-spark-line />
                {glowPoints.map(([x, y]) => (
                  <g key={`${x}-${y}`} data-spark-dot>
                    <circle cx={x} cy={y} r="5" fill="#2E9BFF" opacity="0.25" />
                    <circle cx={x} cy={y} r="2" fill="#D6EEFF" />
                  </g>
                ))}
              </svg>
            </GlassCard>

            <GlassCard className="glass--panel flex-1 p-5">
              <dl className="flex flex-col gap-3 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-2">{HERO.hud.reviewedLabel}</dt>
                  <dd ref={reviewedRef} className="mono text-text-1">
                    {`${fmt.format(HERO.hud.generatedStart)}/${fmt.format(HERO.hud.generatedStart)}`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-2">{HERO.hud.blockedLabel}</dt>
                  <dd className="mono text-text-1">{HERO.hud.blocked}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-text-2">{HERO.hud.statusLabel}</dt>
                  <dd className="mono inline-flex items-center gap-1.5 text-ok">
                    {HERO.hud.statusValue}
                    <Icon name="Check" size={14} strokeWidth={2} />
                  </dd>
                </div>
              </dl>
            </GlassCard>
          </div>
        </div>

        <div ref={cueRef} className="pe mt-12 flex items-center justify-end gap-3 lg:absolute lg:bottom-[-16px] lg:right-0 lg:mt-0">
          <a href="#porque" className="btn btn--circle" aria-label={HERO.scrollCueAria} onClick={onAnchorClick}>
            <span data-cue-arrow className="inline-flex">
              <Icon name="ArrowDown" size={16} />
            </span>
          </a>
          <span className="text-[12px] text-text-2">{HERO.scrollCue}</span>
        </div>
      </div>
    </section>
  );
}
