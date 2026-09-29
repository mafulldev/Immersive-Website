import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { onAnchorClick } from '../lib/anchors';
import { PIN_MEDIA, pinEnd } from '../lib/pin';
import { world } from '../store/world';
import { sound } from '../lib/sound';
import { HERO, PROCESS } from '../content/copy';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SplitHeading } from '../components/ui/SplitHeading';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { IconTile } from '../components/ui/IconTile';
import { Icon } from '../components/ui/Icon';
import { useReducedMotion } from '../hooks/useReducedMotion';

const STEPS = PROCESS.steps.length;
const STEP_SPAN = 0.9 / STEPS;
const RESOLVE_AT = 0.6;
const CORE_Y = -17;

type Phase = 'finale' | `${number}:alert` | `${number}:ok`;

function phaseContent(phase: Phase): { text: string; tone: 'danger' | 'ok' } {
  if (phase === 'finale') return { text: PROCESS.finale, tone: 'ok' };
  const [idx, kind] = phase.split(':');
  const step = PROCESS.steps[Number(idx)];
  return kind === 'ok' ? { text: step.resolved, tone: 'ok' } : { text: step.alert, tone: 'danger' };
}

export function Process() {
  const root = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = root.current;
      const card = cardRef.current;
      if (!el || reduced) return;
      const q = gsap.utils.selector(el);

      gsap.from(q('[data-text-reveal]'), {
        y: 16,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'caudal',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      });

      if (!card) return;
      const pills = q<HTMLElement>('[data-pill]');
      const bars = pills.map((p) => p.querySelector<HTMLElement>('.pill__bar'));
      const textEl = card.querySelector<HTMLElement>('[data-alert-text]');
      const iconAlert = card.querySelector<HTMLElement>('[data-icon-alert]');
      const iconOk = card.querySelector<HTMLElement>('[data-icon-ok]');
      const label = card.querySelector<HTMLElement>('[data-alert-label]');
      if (!textEl || !iconAlert || !iconOk || !label) return;

      let lastPhase: Phase = '0:alert';
      let lastProgress = 0;
      let lastStep = -1;
      const pulse = { y: CORE_Y };
      let pulseTween: gsap.core.Tween | null = null;

      const startPulse = () => {
        pulseTween?.kill();
        pulse.y = CORE_Y;
        pulseTween = gsap.to(pulse, {
          y: -37,
          duration: 2.6,
          ease: 'power1.in',
          onUpdate: () => world.setState({ pulseY: pulse.y }),
          onComplete: () => world.setState({ pulseY: 999 }),
        });
      };
      const stopPulse = () => {
        pulseTween?.kill();
        pulseTween = null;
        world.setState({ pulseY: 999 });
      };

      const applyPhase = (phase: Phase, forward: boolean) => {
        const { text, tone } = phaseContent(phase);
        card.dataset.tone = tone;
        label.textContent = tone === 'ok' ? PROCESS.resolvedLabel : PROCESS.alertLabel;
        gsap.to(textEl, { duration: 0.6, ease: 'none', overwrite: true, scrambleText: { text, chars: HERO.scrambleChars, speed: 0.7 } });
        gsap.to(iconAlert, { autoAlpha: tone === 'danger' ? 1 : 0, scale: tone === 'danger' ? 1 : 0.6, duration: 0.35, ease: 'caudal', overwrite: true });
        gsap.to(iconOk, { autoAlpha: tone === 'ok' ? 1 : 0, scale: tone === 'ok' ? 1 : 0.6, duration: 0.35, ease: 'caudal', overwrite: true });
        if (tone === 'ok' && forward) sound.tick();
        if (phase === 'finale' && forward) startPulse();
        if (lastPhase === 'finale' && phase !== 'finale') stopPulse();
      };

      const update = (progress: number) => {
        const finale = progress >= 0.9;
        const raw = progress / STEP_SPAN;
        const stepIdx = Math.min(STEPS - 1, Math.floor(raw));
        const local = finale ? 1 : gsap.utils.clamp(0, 1, raw - stepIdx);
        // Câmera (dolly z 12→9) e uChaos (.85→.3) são animados pelo segmento do pin em scrollSync.
        world.setState({ resolved: Math.min(STEPS, raw) });
        pills.forEach((pill, i) => {
          pill.dataset.state = finale || i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'idle';
        });
        // No mobile a lista vira chips com scroll horizontal: mantém o chip ativo à vista.
        const list = pills[0]?.parentElement;
        const activePill = pills[stepIdx];
        if (list && activePill && list.scrollWidth > list.clientWidth + 8 && stepIdx !== lastStep) {
          gsap.to(list, { scrollLeft: Math.max(0, activePill.offsetLeft - 20), duration: 0.5, ease: 'caudal', overwrite: true });
        }
        lastStep = stepIdx;
        const phase: Phase = finale ? 'finale' : `${stepIdx}:${local >= RESOLVE_AT ? 'ok' : 'alert'}`;
        if (phase !== lastPhase) {
          applyPhase(phase, progress >= lastProgress);
          lastPhase = phase;
        }
        lastProgress = progress;
      };

      const mm = gsap.matchMedia();
      mm.add(PIN_MEDIA, (context) => {
        const conditions = context.conditions as { isMobile: boolean };
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: pinEnd(conditions.isMobile),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => update(self.progress),
          },
        });
        bars.forEach((bar, i) => {
          if (!bar) return;
          tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: STEP_SPAN * 0.5, ease: 'none' }, i * STEP_SPAN);
        });
        tl.to({}, { duration: 0.1 }, 0.9);
        return () => {
          stopPulse();
          world.setState({ resolved: 0 });
        };
      });

      gsap.set(iconOk, { autoAlpha: 0, scale: 0.6 });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="processo" className="section py-0!" aria-labelledby="processo-title">
      <div className="shell flex min-h-[100svh] items-center py-[calc(var(--nav-h)+24px)] lg:py-0">
        <div className="grid-12 w-full lg:items-center">
          <div className="pe scrim col-span-12 flex flex-col gap-5 lg:col-span-4">
            <div data-text-reveal>
              <Eyebrow>{PROCESS.eyebrow}</Eyebrow>
            </div>
            <SplitHeading as="h2" id="processo-title" copy={PROCESS.title} mode="scroll" />
            <p className="lead" data-text-reveal>
              {PROCESS.body}
            </p>
            <div data-text-reveal>
              <Button variant="secondary" href={PROCESS.buttonTarget} onClick={onAnchorClick}>
                {PROCESS.button}
              </Button>
            </div>
          </div>

          {/* Centro: o Núcleo vive no WebGL. Aqui só o card de alerta, ancorado à direita dele. */}
          <div className="relative col-span-12 flex lg:col-span-5 lg:min-h-[60svh] lg:items-center lg:justify-end">
            {reduced ? (
              <GlassCard className="pe glass--panel w-full p-5">
                <h3 className="card-title">{PROCESS.staticHeading}</h3>
                <ol className="mt-4 flex flex-col gap-3 text-[12px]" role="list">
                  {PROCESS.steps.map((s, i) => (
                    <li key={s.label} className="flex flex-col gap-1 border-t border-line pt-3 first:border-t-0 first:pt-0">
                      <span className="text-text-1">
                        {i + 1}. {s.label}
                      </span>
                      <span className="mono text-danger">{s.alert}</span>
                      <span className="mono text-ok">
                        {PROCESS.arrow} {s.resolved}
                      </span>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            ) : (
              <div ref={cardRef} className="pe glass alert-card w-full max-w-[340px] p-4 lg:absolute lg:right-[-12%] lg:top-1/2 lg:-translate-y-1/2" data-tone="danger" aria-hidden="true">
                <div className="flex items-start gap-3">
                  <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-glass-strong">
                    <span data-icon-alert className="absolute inline-flex text-danger">
                      <Icon name="TriangleAlert" size={18} />
                    </span>
                    <span data-icon-ok className="absolute inline-flex text-ok">
                      <Icon name="CircleCheck" size={18} />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="hud-eyebrow" data-alert-label>
                      {PROCESS.alertLabel}
                    </p>
                    <p className="mono mt-1.5 text-[12px] leading-[1.5] text-text-1" data-alert-text>
                      {PROCESS.steps[0].alert}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!reduced && (
              <p className="sr-only">
                {PROCESS.srIntro}{' '}
                {PROCESS.steps.map((s) => `${s.label}: ${s.alert} ${PROCESS.arrow} ${s.resolved}. `).join('')}
              </p>
            )}
          </div>

          <ol
            role="list"
            className="pe no-scrollbar col-span-12 -mx-[var(--pad-x)] flex gap-2 overflow-x-auto px-[var(--pad-x)] pb-1 lg:col-span-3 lg:mx-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-0"
            aria-label={PROCESS.eyebrow}
          >
            {PROCESS.steps.map((s, i) => (
              <li key={s.label} className="glass pill shrink-0 lg:shrink" data-pill data-state={reduced ? 'done' : i === 0 ? 'active' : 'idle'}>
                <span className="pill__bar" aria-hidden="true" />
                <IconTile name={s.icon} />
                <span className="whitespace-nowrap">
                  <span className="mono mr-1.5 text-[11px] text-text-3">{String(i + 1).padStart(2, '0')}</span>
                  {s.label}
                </span>
                <span className="pill__check" aria-hidden="true">
                  <Icon name="Check" size={14} strokeWidth={2} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
