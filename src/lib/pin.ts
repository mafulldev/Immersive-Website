/** Extensão do pin da seção 03 (spec 7.4): 200% no desktop, 120% no mobile. */
export const PIN_MEDIA = { isDesktop: '(min-width: 1024px)', isMobile: '(max-width: 1023px)' } as const;

export function pinEnd(isMobile: boolean): string {
  return isMobile ? '+=120%' : '+=200%';
}
