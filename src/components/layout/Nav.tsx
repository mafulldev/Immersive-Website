import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { getLenis, scrollToTarget } from '../../lib/lenis';
import { useSections } from '../../lib/sections';
import { NAV } from '../../content/copy';
import { Logo } from './Logo';
import { Button } from '../ui/Button';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const active = useSections((s) => s.active);

  /* Fundo após 80px + esconder/mostrar pela direção do scroll. */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const reduced = prefersReducedMotion();
    let hidden = false;
    let lastY = window.scrollY;

    const apply = (y: number, direction: number) => {
      nav.classList.toggle('is-scrolled', y > 80);
      const shouldHide = direction > 0 && y > 160 && !open;
      if (shouldHide !== hidden) {
        hidden = shouldHide;
        gsap.to(nav, { yPercent: hidden ? -100 : 0, duration: reduced ? 0 : 0.4, ease: 'caudal', overwrite: true });
      }
    };

    const lenis = getLenis();
    if (lenis) {
      const onScroll = () => apply(lenis.scroll, lenis.direction);
      lenis.on('scroll', onScroll);
      return () => lenis.off('scroll', onScroll);
    }
    const onWindowScroll = () => {
      const y = window.scrollY;
      apply(y, y > lastY ? 1 : -1);
      lastY = y;
    };
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, [open]);

  /* Indicador do link ativo desliza até o link da seção atual. */
  useEffect(() => {
    const list = listRef.current;
    const ind = indicatorRef.current;
    if (!list || !ind) return;
    const link = list.querySelector<HTMLAnchorElement>(`a[data-id="${active}"]`);
    if (!link) {
      gsap.to(ind, { opacity: 0, duration: 0.3 });
      return;
    }
    const x = link.offsetLeft + (link.offsetWidth - 18) / 2;
    gsap.to(ind, { x, opacity: 1, duration: prefersReducedMotion() ? 0 : 0.6, ease: 'caudal' });
  }, [active]);

  /* Intro: itens da nav descem de -16 com stagger .05. */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = navRef.current?.querySelectorAll('[data-nav-item]');
      if (!items?.length) return;
      gsap.from(items, { y: -16, opacity: 0, duration: 0.6, ease: 'caudal', stagger: 0.05 });
    },
    { scope: navRef },
  );

  /* Menu mobile: vidro fullscreen com links em stagger. */
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const links = menu.querySelectorAll('[data-menu-link]');
    const reduced = prefersReducedMotion();
    if (open) {
      document.documentElement.style.overflow = 'hidden';
      getLenis()?.stop();
      gsap.set(menu, { visibility: 'visible' });
      gsap.to(menu, { opacity: 1, duration: reduced ? 0 : 0.5, ease: 'caudal' });
      gsap.fromTo(links, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: reduced ? 0 : 0.7, ease: 'caudal', stagger: 0.06, delay: 0.1 });
    } else {
      document.documentElement.style.overflow = '';
      getLenis()?.start();
      gsap.to(menu, {
        opacity: 0,
        duration: reduced ? 0 : 0.4,
        ease: 'caudal',
        onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToTarget(`#${id}`);
    ScrollTrigger.refresh();
  };

  return (
    <>
      <header ref={navRef} className="nav" role="banner">
        <div className="shell flex h-full items-center justify-between gap-6">
          <a href="#inicio" aria-label={NAV.homeAria} onClick={(e) => go(e, 'inicio')} data-nav-item className="shrink-0">
            <Logo />
          </a>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul ref={listRef} className="relative flex items-center gap-9" role="list">
              {NAV.links.map((l) => (
                <li key={l.id} data-nav-item>
                  <a
                    href={`#${l.id}`}
                    data-id={l.id}
                    className="nav__link"
                    aria-current={active === l.id ? 'true' : undefined}
                    onClick={(e) => go(e, l.id)}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <span ref={indicatorRef} className="nav__indicator" aria-hidden="true" />
            </ul>
          </nav>

          <div className="flex items-center gap-3" data-nav-item>
            <Button variant="nav" href="#contato" className="hidden lg:inline-flex" onClick={(e) => go(e, 'contato')}>
              {NAV.cta}
            </Button>
            <button
              type="button"
              className={`burger lg:hidden ${open ? 'is-open' : ''}`}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? NAV.menuClose : NAV.menuOpen}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div ref={menuRef} id="menu-mobile" className="mobile-menu lg:hidden" aria-hidden={!open}>
        <nav aria-label="Menu">
          <ul role="list" className="flex flex-col">
            {NAV.links.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="mobile-menu__link" data-menu-link onClick={(e) => go(e, l.id)} tabIndex={open ? 0 : -1}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8" data-menu-link>
          <Button variant="primary" href="#contato" onClick={(e) => go(e, 'contato')} tabIndex={open ? 0 : -1}>
            {NAV.cta}
          </Button>
        </div>
      </div>
    </>
  );
}
