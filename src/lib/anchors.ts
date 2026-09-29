import type { MouseEvent } from 'react';
import { scrollToTarget } from './lenis';

/** Intercepta cliques em âncoras internas (#id) para usar o scroll suave com offset da nav. */
export function onAnchorClick(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>): void {
  const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
  if (!href || !href.startsWith('#') || href.length < 2) return;
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
  if (history.replaceState) history.replaceState(null, '', href);
}
