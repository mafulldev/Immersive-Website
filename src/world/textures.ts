import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';

/** Sprite radial suave (branco → transparente). */
export function makeRadialTexture(size = 128, inner = 0, power = 1): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, inner, size / 2, size / 2, size / 2);
    const steps = 8;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const a = Math.pow(1 - t, power);
      g.addColorStop(t, `rgba(255,255,255,${a.toFixed(3)})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  return tex;
}

export const GLYPH_TOKENS = ['{', '}', '<', '>', '/', '=', ';', '(', ')', '0', '1', 'const', 'fn', '=>', '&&', '||'] as const;
export const ATLAS_CELLS = 8;

/** Atlas 8×8 de glifos em JetBrains Mono, gerado em runtime. */
export function makeGlyphAtlas(size = 512): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cell = size / ATLAS_CELLS;
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < ATLAS_CELLS * ATLAS_CELLS; i += 1) {
      const token = GLYPH_TOKENS[i % GLYPH_TOKENS.length];
      const col = i % ATLAS_CELLS;
      const row = Math.floor(i / ATLAS_CELLS);
      const px = token.length === 1 ? cell * 0.72 : token.length === 2 ? cell * 0.5 : cell * 0.3;
      ctx.font = `500 ${px}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(token, col * cell + cell / 2, row * cell + cell / 2 + px * 0.04);
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.colorSpace = SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

/** Mapa de normais procedural para a ondulação do lago (tileável). */
export function makeRippleNormalMap(size = 256): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const height = new Float32Array(size * size);
    const waves = [
      { fx: 3, fy: 1, a: 1 },
      { fx: -2, fy: 4, a: 0.7 },
      { fx: 5, fy: -3, a: 0.5 },
      { fx: 1, fy: 7, a: 0.35 },
    ];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const u = (x / size) * Math.PI * 2;
        const v = (y / size) * Math.PI * 2;
        let h = 0;
        waves.forEach((w) => {
          h += Math.sin(u * w.fx + v * w.fy) * w.a;
        });
        height[y * size + x] = h;
      }
    }
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const l = height[y * size + ((x - 1 + size) % size)];
        const r = height[y * size + ((x + 1) % size)];
        const t = height[((y - 1 + size) % size) * size + x];
        const b = height[((y + 1) % size) * size + x];
        const nx = (l - r) * 0.5;
        const ny = (t - b) * 0.5;
        const nz = 1;
        const len = Math.hypot(nx, ny, nz);
        const idx = (y * size + x) * 4;
        img.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
        img.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
        img.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(6, 4);
  return tex;
}

/** Gradiente radial azul para o lago no tier baixo. */
export function makePoolGradient(size = 256): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#03070D';
    ctx.fillRect(0, 0, size, size);
    const g = ctx.createRadialGradient(size / 2, size * 0.3, 0, size / 2, size * 0.3, size * 0.6);
    g.addColorStop(0, 'rgba(46,155,255,0.55)');
    g.addColorStop(0.5, 'rgba(14,79,184,0.25)');
    g.addColorStop(1, 'rgba(3,7,13,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
