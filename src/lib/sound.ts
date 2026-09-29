/**
 * Som ambiente opcional, sintetizado com Web Audio (sem assets).
 * Loop de cachoeira: ruído filtrado com movimento lento. "Tick" a cada problema resolvido.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
const listeners = new Set<(on: boolean) => void>();

function makeNoiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
  const rate = context.sampleRate;
  const buffer = context.createBuffer(2, rate * seconds, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      // ruído "marrom" suave: integra e amortece
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

function build(): void {
  if (ctx) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx, 4);
  noise.loop = true;

  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 900;
  low.Q.value = 0.7;

  const hiss = ctx.createBiquadFilter();
  hiss.type = 'bandpass';
  hiss.frequency.value = 3200;
  hiss.Q.value = 0.5;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.18;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain);
  lfoGain.connect(low.frequency);

  noise.connect(low);
  low.connect(master);
  noise.connect(hiss);
  hiss.connect(hissGain);
  hissGain.connect(master);

  noise.start();
  lfo.start();
}

function notify(): void {
  listeners.forEach((l) => l(enabled));
}

export const sound = {
  isEnabled(): boolean {
    return enabled;
  },
  subscribe(listener: (on: boolean) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async enable(): Promise<void> {
    build();
    if (!ctx || !master) return;
    if (ctx.state === 'suspended') await ctx.resume();
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.25, now + 1.5);
    enabled = true;
    notify();
  },
  disable(): void {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.6);
    enabled = false;
    notify();
  },
  async toggle(): Promise<void> {
    if (enabled) this.disable();
    else await this.enable();
  },
  /** Tick suave: sino curto de 880 → 1320 Hz. */
  tick(): void {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },
};
