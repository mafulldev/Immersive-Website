/**
 * Estado por frame compartilhado entre os elementos do mundo (não causa re-render).
 * O glitch é sorteado pela cachoeira e lido pelos glifos.
 */
export const runtime = {
  time: 0,
  glitch: 0,
  glitchY: 0,
  glitchTimer: 0,
};

/** Chance de glitch por segundo com uChaos > .5 (spec 8.4). */
export const GLITCH_CHANCE_PER_SECOND = 0.02;
export const GLITCH_DURATION = 0.08;

export function updateGlitch(dt: number, chaos: number, camY: number): void {
  if (runtime.glitchTimer > 0) {
    runtime.glitchTimer -= dt;
    if (runtime.glitchTimer <= 0) runtime.glitch = 0;
    return;
  }
  if (chaos > 0.5 && Math.random() < GLITCH_CHANCE_PER_SECOND * dt) {
    runtime.glitch = 1;
    runtime.glitchY = camY + (Math.random() - 0.5) * 5;
    runtime.glitchTimer = GLITCH_DURATION;
  }
}
