import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { scrollToTarget } from '../../lib/lenis';
import { BRAND, FOOTER, NAV } from '../../content/copy';
import { Logo } from './Logo';
import { SocialIcon } from '../ui/Icon';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

export function Footer() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = el.querySelectorAll('[data-reveal]');
      gsap.from(items, {
        y: prefersReducedMotion() ? 0 : 20,
        opacity: 0,
        duration: prefersReducedMotion() ? 0.3 : 1,
        ease: 'caudal',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    },
    { scope: ref },
  );

  return (
    <footer ref={ref} id="rodape" className="section relative flex min-h-[70svh] flex-col justify-end pb-10" aria-labelledby="rodape-titulo">
      <h2 id="rodape-titulo" className="sr-only">
        {BRAND.name}
      </h2>
      <div className="shell pe">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal className="scrim flex flex-col gap-3">
            <Logo />
            <p className="text-[13px] text-text-2">{BRAND.tagline}</p>
          </div>

          <nav aria-label={FOOTER.navAria} data-reveal>
            <ul role="list" className="flex flex-wrap gap-x-7 gap-y-3">
              {NAV.links.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTarget(`#${l.id}`);
                    }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ul role="list" aria-label={FOOTER.socialAria} className="flex items-center gap-5" data-reveal>
            {FOOTER.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="inline-flex text-text-2 transition-colors duration-300 hover:text-blue-300"
                >
                  <SocialIcon name={s.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[12px] text-text-3 sm:flex-row sm:items-center sm:justify-between" data-reveal>
          <p>{FOOTER.legal}</p>
          <ul role="list" className="flex gap-5">
            {FOOTER.legalLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="footer-link text-[12px]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
