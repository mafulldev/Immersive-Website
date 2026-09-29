import { createContext, useContext } from 'react';
import type { WaterPath } from './path';
import type { Tier } from '../store/world';
import { TIER_CONFIG } from '../hooks/useTier';

export interface WorldConfig {
  path: WaterPath;
  tier: Tier;
  cfg: (typeof TIER_CONFIG)[Tier];
  mobile: boolean;
  /** Ponteiro fino (parallax de mouse só no desktop). */
  finePointer: boolean;
}

export const WorldContext = createContext<WorldConfig | null>(null);

export function useWorldConfig(): WorldConfig {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error('useWorldConfig precisa estar dentro de <World>.');
  return ctx;
}
