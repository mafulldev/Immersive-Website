import { CatmullRomCurve3, DataTexture, LinearFilter, RGBAFormat, UnsignedByteType, Vector3 } from 'three';

/** Caminho da água (spec 8.2). */
export const PATH_POINTS: ReadonlyArray<readonly [number, number, number]> = [
  [1.4, 2.2, -2],
  [1.1, -1.5, -2],
  [0.2, -4.5, -1.8],
  [-0.6, -8, -1.6],
  [-0.2, -12, -1.6],
  [-0.3, -17, -2.5],
  [0.3, -22, -1.8],
  [0.8, -26, -1.8],
  [0.1, -31, -1.6],
  [0, -36, -1.5],
  // Trecho final até a superfície do lago (a spec termina em -36; a água precisa tocar a água).
  [0, -38.7, -1.4],
];

export const SEGMENTS = PATH_POINTS.length - 1;
export const POOL_Y = -38.5;
export const CORE_POSITION: readonly [number, number, number] = [-0.3, -17, -1];
/** Raio do núcleo. A spec sugere 2.6; 2.15 mantém a esfera dentro das colunas 5–9 com o dolly da câmera. */
export const CORE_RADIUS = 2.15;
/** Pontos de impacto (névoa): índices no caminho. */
export const IMPACT_INDICES = [2, 5, 7, 10] as const;
/** Amostras do caminho enviadas como uniform (glifos) e textura 1D (placas). */
export const PATH_SAMPLES = 64;
export const PATH_Y_MAX = 2.2;
export const PATH_Y_MIN = -38.7;

export function widthAt(t: number): number {
  return 0.9 + 0.7 * t;
}

export interface WaterPath {
  curve: CatmullRomCurve3;
  points: Vector3[];
  xScale: number;
  /** 64 amostras xyz (Float32Array de 192). */
  samples: Float32Array;
  sampleVectors: Vector3[];
  length: number;
  /** Textura 1D: x e z do caminho em função de y (normalizado entre PATH_Y_MIN e PATH_Y_MAX). */
  texture: DataTexture;
  impacts: Vector3[];
}

/** Cria o caminho. No mobile, x é multiplicado por 0.3 para centralizar a cachoeira. */
export function createWaterPath(xScale: number): WaterPath {
  const points = PATH_POINTS.map(([x, y, z]) => new Vector3(x * xScale, y, z));
  const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const sampleVectors = curve.getSpacedPoints(PATH_SAMPLES - 1);
  const samples = new Float32Array(PATH_SAMPLES * 3);
  sampleVectors.forEach((p, i) => {
    samples[i * 3] = p.x;
    samples[i * 3 + 1] = p.y;
    samples[i * 3 + 2] = p.z;
  });

  const size = 256;
  const data = new Uint8Array(size * 4);
  for (let i = 0; i < size; i += 1) {
    const y = PATH_Y_MIN + (i / (size - 1)) * (PATH_Y_MAX - PATH_Y_MIN);
    const p = pointAtY(sampleVectors, y);
    data[i * 4] = Math.round(((p.x + 4) / 8) * 255);
    data[i * 4 + 1] = Math.round(((p.z + 4) / 8) * 255);
    data[i * 4 + 2] = Math.round(widthAt(p.t) * 100);
    data[i * 4 + 3] = 255;
  }
  const texture = new DataTexture(data, size, 1, RGBAFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  return {
    curve,
    points,
    xScale,
    samples,
    sampleVectors,
    length: curve.getLength(),
    texture,
    impacts: IMPACT_INDICES.map((i) => points[i].clone()),
  };
}

/** Ponto do caminho numa dada altura y (busca linear nas amostras; y decresce monotonicamente). */
function pointAtY(samples: Vector3[], y: number): { x: number; z: number; t: number } {
  if (y >= samples[0].y) return { x: samples[0].x, z: samples[0].z, t: 0 };
  const last = samples[samples.length - 1];
  if (y <= last.y) return { x: last.x, z: last.z, t: 1 };
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    if (y <= a.y && y >= b.y) {
      const f = (a.y - y) / (a.y - b.y || 1);
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, t: (i + f) / (samples.length - 1) };
    }
  }
  return { x: last.x, z: last.z, t: 1 };
}
