import { Fragment, useRef, type ElementType } from 'react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

interface HeadingCopy {
  readonly lines: readonly string[];
  readonly accentLine: number;
  readonly accentPrefix: string;
  readonly accent: string;
}

interface SplitHeadingProps {
  as: 'h1' | 'h2';
  copy: HeadingCopy;
  id?: string;
  className?: string;
  /** 'intro' anima ao montar (com delay); 'scroll' anima ao entrar na viewport. */
  mode: 'intro' | 'scroll';
  delay?: number;
  /** Varredura de brilho única sobre a palavra em azul após o reveal. */
  sheen?: boolean;
  onReady?: (tl: gsap.core.Tween) => void;
}

/**
 * Título com reveal de linhas mascaradas (SplitText) e palavra destacada em azul.
 * A quebra de linha é fixa (<br>) para reproduzir a composição da referência.
 */
export function SplitHeading({ as, copy, id, className = '', mode, delay = 0, sheen = false }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag: ElementType = as;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none', delay: mode === 'intro' ? delay : 0, scrollTrigger: mode === 'scroll' ? { trigger: el, start: 'top 85%' } : undefined });
        return;
      }
      const split = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) => {
          const tween = gsap.from(self.lines, {
            yPercent: 105,
            duration: 1.1,
            ease: 'caudal',
            stagger: 0.1,
            delay: mode === 'intro' ? delay : 0,
            scrollTrigger: mode === 'scroll' ? { trigger: el, start: 'top 85%', once: true } : undefined,
            onComplete: () => {
              // Libera o glow da palavra azul (text-shadow) do clip das máscaras.
              gsap.set(self.masks, { overflow: 'visible' });
              if (!sheen) return;
              const accent = el.querySelector<HTMLElement>('.accent');
              if (!accent) return;
              gsap.fromTo(
                accent,
                { '--sheen': '100%', '--sheen-opacity': 1 },
                { '--sheen': '0%', duration: 1.1, ease: 'power2.inOut', onComplete: () => gsap.set(accent, { '--sheen-opacity': 0 }) },
              );
            },
          });
          return tween;
        },
      });
      return () => split.revert();
    },
    { scope: ref, dependencies: [mode, delay, sheen] },
  );

  return (
    <Tag ref={ref} id={id} className={`${as} ${className}`.trim()}>
      {copy.lines.map((line, i) => {
        const isAccent = i === copy.accentLine && copy.accent.length > 0;
        return (
          <Fragment key={line}>
            {isAccent ? (
              <>
                {copy.accentPrefix}
                <span className={`accent ${sheen ? 'accent--sheen' : ''}`.trim()} data-text={copy.accent}>
                  {copy.accent}
                </span>
              </>
            ) : (
              line
            )}
            {i < copy.lines.length - 1 && <br />}
          </Fragment>
        );
      })}
    </Tag>
  );
}
