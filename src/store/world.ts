import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export type Tier = 'high' | 'medium' | 'low';

export interface WorldState {
  /** Alvos de câmera. O rig amortece até eles em useFrame. */
  camY: number;
  camZ: number;
  tilt: number;
  /** 1 no topo (caos), 0 no lago (ordem). */
  chaos: number;
  /** 0 no topo, 1 no lago. */
  order: number;
  /** Progresso contínuo dos 5 passos da seção 03 (0..5). */
  resolved: number;
  /** Y do pulso azul que desce pela água. 999 = inativo. */
  pulseY: number;
  /** Ignição da água, 0..1. */
  reveal: number;
  /** Velocidade do scroll (Lenis). */
  velocity: number;
  /** Mouse normalizado (-1..1). */
  mouse: { x: number; y: number };
  tier: Tier;
  /** Primeiro frame renderizado: dispara o crossfade do poster. */
  ready: boolean;
  /** Ondas de clique no lago: [x, z, tempo de início] em unidades de mundo / segundos. */
  ripples: Array<{ x: number; z: number; t: number }>;
  setTier: (tier: Tier) => void;
  setReady: (ready: boolean) => void;
  addRipple: (x: number, z: number, t: number) => void;
}

export const world = createStore<WorldState>((set) => ({
  camY: 0,
  camZ: 12,
  tilt: 0,
  chaos: 1,
  order: 0,
  resolved: 0,
  pulseY: 999,
  reveal: 0,
  velocity: 0,
  mouse: { x: 0, y: 0 },
  tier: 'high',
  ready: false,
  ripples: [],
  setTier: (tier) => set({ tier }),
  setReady: (ready) => set({ ready }),
  addRipple: (x, z, t) =>
    set((s) => ({ ripples: [...s.ripples, { x, z, t }].slice(-4) })),
}));

/** Hook de leitura reativa (usar apenas fora de useFrame). */
export function useWorld<T>(selector: (s: WorldState) => T): T {
  return useStore(world, selector);
}

/** Valores de câmera por seção (ver spec 8.3). */
export const CAMERA_BY_SECTION = {
  inicio: { camY: 0, camZ: 12, tilt: 0, chaos: 1, order: 0 },
  porque: { camY: -8, camZ: 12, tilt: 0, chaos: 0.9, order: 0.1 },
  processo: { camY: -17, camZ: 12, tilt: 0, chaos: 0.85, order: 0.2 },
  solucoes: { camY: -26, camZ: 12, tilt: 0, chaos: 0.25, order: 0.7 },
  contato: { camY: -33, camZ: 12, tilt: 0, chaos: 0.1, order: 0.9 },
  rodape: { camY: -37, camZ: 12, tilt: -0.12, chaos: 0, order: 1 },
} as const;
