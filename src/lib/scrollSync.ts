import { gsap, ScrollTrigger } from './gsap';
import { SECTIONS, type SectionId } from '../content/copy';
import { sections } from './sections';
import { PIN_MEDIA, pinEnd } from './pin';
import { world, CAMERA_BY_SECTION } from '../store/world';

interface CameraKeys {
  camY: number;
  camZ: number;
  tilt: number;
  chaos: number;
  order: number;
}

/** Valores de saída da seção 03: o pin leva chaos de .85 a .3 e faz o dolly de z 12 para 9. */
const PROCESS_EXIT: CameraKeys = { ...CAMERA_BY_SECTION.processo, chaos: 0.3, camZ: 9 };

function enterValues(id: SectionId): CameraKeys {
  return { ...CAMERA_BY_SECTION[id] };
}

function exitValues(id: SectionId): CameraKeys {
  return id === 'processo' ? { ...PROCESS_EXIT } : enterValues(id);
}

interface Segment {
  /** Objeto próprio do segmento: só o tween dele escreve aqui (sem corrida entre scrubs). */
  state: CameraKeys;
  trigger: ScrollTrigger;
}

/**
 * Cria, na ordem do DOM, os ScrollTriggers que:
 * 1. marcam a seção ativa e seu progresso (nav, trilho);
 * 2. animam o alvo de câmera/caos do mundo, um segmento por transição de seção (scrub 1),
 *    mais um segmento para o pin da seção 03.
 *
 * Cada segmento anima o próprio objeto. A cada tick, `apply` escolhe o último segmento
 * já iniciado pelo scroll e publica o estado dele no store — assim um salto de âncora
 * nunca deixa a câmera presa num valor intermediário.
 */
export function createScrollSync(withWorld: boolean): () => void {
  if (location.search.includes('debug')) {
    (window as unknown as { __ST: unknown; __world: unknown }).__ST = ScrollTrigger;
    (window as unknown as { __ST: unknown; __world: unknown }).__world = world;
  }

  const ctx = gsap.context(() => {
    const segments: Segment[] = [];
    const initial = enterValues('inicio');

    const apply = () => {
      const y = window.scrollY;
      let current: CameraKeys = initial;
      for (const seg of segments) {
        if (y >= seg.trigger.start) current = seg.state;
      }
      world.setState({ camY: current.camY, camZ: current.camZ, tilt: current.tilt, chaos: current.chaos, order: current.order });
    };

    const addSegment = (from: CameraKeys, to: CameraKeys, vars: ScrollTrigger.Vars): (() => void) => {
      const state: CameraKeys = { ...from };
      const tween = gsap.fromTo(state, from, {
        ...to,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: { scrub: 1, ...vars },
        onUpdate: apply,
      });
      const segment: Segment | null = tween.scrollTrigger ? { state, trigger: tween.scrollTrigger } : null;
      if (segment) segments.push(segment);
      return () => {
        if (!segment) return;
        const idx = segments.indexOf(segment);
        if (idx >= 0) segments.splice(idx, 1);
        tween.kill();
      };
    };

    const mm = gsap.matchMedia();

    SECTIONS.forEach((section, i) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      // A seção fica ativa do seu meio até o meio da próxima (o endTrigger absorve o pin da seção 03).
      const next = i < SECTIONS.length - 1 ? document.getElementById(SECTIONS[i + 1].id) : null;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        endTrigger: next ?? el,
        // A última seção nunca "sai": o fim fica além do scroll máximo.
        end: next ? 'top 50%' : 'bottom top',
        onToggle: (self) => {
          if (self.isActive) sections.setState({ active: section.id });
        },
        onUpdate: (self) => {
          if (self.isActive) sections.setState({ progress: self.progress });
        },
      });

      if (!withWorld || i === 0) return;
      const isLast = i === SECTIONS.length - 1;
      addSegment(exitValues(SECTIONS[i - 1].id), enterValues(section.id), {
        trigger: el,
        start: 'top bottom',
        end: isLast ? 'max' : 'top top',
      });

      if (section.id === 'processo') {
        mm.add(PIN_MEDIA, (context) => {
          const conditions = context.conditions as { isMobile: boolean };
          const remove = addSegment(enterValues('processo'), PROCESS_EXIT, {
            trigger: el,
            start: 'top top',
            end: pinEnd(conditions.isMobile),
          });
          apply();
          return remove;
        });
      }
    });

    ScrollTrigger.create({
      start: 40,
      onEnter: () => sections.setState({ scrolled: true }),
    });

    if (withWorld) ScrollTrigger.addEventListener('refresh', apply);
    return () => {
      ScrollTrigger.removeEventListener('refresh', apply);
      mm.revert();
    };
  });

  return () => ctx.revert();
}
