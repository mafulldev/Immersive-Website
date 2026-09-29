import { useEffect } from 'react';
import { world, type Tier } from '../store/world';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/** Detecta suporte a WebGL2 sem manter contexto vivo. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_lose_context');
    ext?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function rendererName(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return '';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name.toLowerCase();
  } catch {
    return '';
  }
}

/** Heurística inicial de tier. O PerformanceMonitor do drei ajusta em tempo real. */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const width = window.innerWidth;
  const renderer = rendererName();
  const weakGpu = /mali-4|mali-t|adreno 3|adreno 4|adreno 5|swiftshader|llvmpipe|intel hd graphics [3-5]/.test(renderer);
  const mobile = width < 1024 || /android|iphone|ipad/i.test(navigator.userAgent);

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += memory >= 8 ? 2 : memory >= 4 ? 1 : 0;
  score += width >= 1280 ? 1 : 0;
  if (weakGpu) score -= 2;
  if (mobile) score -= 1;

  if (score >= 4) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

/** Ajusta o tier no store com base na heurística inicial. */
export function useTier(): void {
  useEffect(() => {
    world.getState().setTier(detectTier());
  }, []);
}

/** Rebaixa um nível. Usado pelo PerformanceMonitor. */
export function degradeTier(): void {
  const { tier, setTier } = world.getState();
  if (tier === 'high') setTier('medium');
  else if (tier === 'medium') setTier('low');
}

/** Sobe um nível (limitado ao tier detectado inicialmente). */
export function upgradeTier(max: Tier): void {
  const { tier, setTier } = world.getState();
  if (tier === 'low' && max !== 'low') setTier('medium');
  else if (tier === 'medium' && max === 'high') setTier('high');
}

export const TIER_CONFIG: Record<Tier, { dpr: [number, number]; particles: number; glyphs: number; bloom: boolean; bloomScale: number; reflector: boolean; reflectorRes: number }> = {
  high: { dpr: [1, 2], particles: 1, glyphs: 1600, bloom: true, bloomScale: 1, reflector: true, reflectorRes: 512 },
  medium: { dpr: [1, 1.5], particles: 0.6, glyphs: 900, bloom: true, bloomScale: 0.5, reflector: true, reflectorRes: 256 },
  low: { dpr: [1, 1], particles: 0.25, glyphs: 0, bloom: false, bloomScale: 0.5, reflector: false, reflectorRes: 128 },
};
