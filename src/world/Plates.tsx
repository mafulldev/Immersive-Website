import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Color, Group, LinearFilter, LinearMipmapLinearFilter, ShaderMaterial, SRGBColorSpace, Vector2 } from 'three';
import { useWorldConfig } from './context';
import { NOISE_GLSL, PATH_LOOKUP_GLSL } from './shaders';
import { PATH_Y_MAX, PATH_Y_MIN } from './path';
import { world } from '../store/world';

type Layer = 'far' | 'mid' | 'near';

interface LayerSpec {
  layer: Layer;
  z: number;
  parallax: number;
  width: number;
}

/** Altura total do mundo coberta pelas placas (do topo do monólito ao lago). */
const WORLD_TOP = 7;
const WORLD_BOTTOM = -41;
const WORLD_H = WORLD_TOP - WORLD_BOTTOM;
const MAX_TILE = 2048;

const LAYERS: LayerSpec[] = [
  { layer: 'far', z: -7, parallax: 0.6, width: 38 },
  // A spec sugere z -2.2; a água vai de z -1.4 a -2.5 e os véus até -3.2, então a placa fica atrás de tudo.
  { layer: 'mid', z: -3.5, parallax: 1.0, width: 27 },
  { layer: 'near', z: 2, parallax: 1.25, width: 16 },
];

interface Tile {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

interface PlatesManifest {
  far?: string[];
  mid?: string[];
  near?: string[];
}

let manifestPromise: Promise<PlatesManifest> | null = null;

/** /world/plates.json lista os tiles de cada camada (de cima para baixo). Vazio = fallback procedural. */
function loadManifest(): Promise<PlatesManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch('/world/plates.json', { cache: 'force-cache' })
      .then((res) => (res.ok && (res.headers.get('content-type') ?? '').includes('json') ? (res.json() as Promise<PlatesManifest>) : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

/**
 * Carrega os tiles de uma camada (cada um com até 2048px, empilhados de cima para baixo).
 * Qualquer falha devolve [] e a camada cai no shader procedural.
 */
async function loadLayer(layer: Layer): Promise<Tile[]> {
  const manifest = await loadManifest();
  const files = manifest[layer] ?? [];
  const tiles: Tile[] = [];
  for (const file of files) {
    try {
      const res = await fetch(`/world/${file}`, { cache: 'force-cache' });
      if (!res.ok) break;
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob);
      if (bitmap.height > MAX_TILE || bitmap.width > MAX_TILE) {
        // Tiles acima de 2048px estouram o limite de textura em mobile: ignora a camada.
        bitmap.close();
        tiles.forEach((t) => t.bitmap.close());
        return [];
      }
      tiles.push({ bitmap, width: bitmap.width, height: bitmap.height });
    } catch {
      tiles.forEach((t) => t.bitmap.close());
      return [];
    }
  }
  return tiles;
}

function useLayerTiles(spec: LayerSpec): Tile[] | null | undefined {
  const [tiles, setTiles] = useState<Tile[] | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    void loadLayer(spec.layer).then((t) => {
      if (cancelled) {
        t.forEach((x) => x.bitmap.close());
        return;
      }
      setTiles(t.length ? t : null);
    });
    return () => {
      cancelled = true;
    };
  }, [spec.layer]);
  return tiles;
}

/* ---------- Placas com imagem ---------- */

function ImagePlate({ spec, tiles }: { spec: LayerSpec; tiles: Tile[] }) {
  const textures = useMemo(
    () =>
      tiles.map((t) => {
        const tex = new CanvasTexture(t.bitmap);
        tex.colorSpace = SRGBColorSpace;
        tex.minFilter = LinearMipmapLinearFilter;
        tex.magFilter = LinearFilter;
        tex.anisotropy = 4;
        return tex;
      }),
    [tiles],
  );
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  const totalPx = tiles.reduce((acc, t) => acc + t.height, 0);
  const scale = WORLD_H / totalPx;
  const width = tiles[0].width * scale;
  let cursor = WORLD_TOP;

  return (
    <>
      {tiles.map((t, i) => {
        const h = t.height * scale;
        const y = cursor - h / 2;
        cursor -= h;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <planeGeometry args={[Math.max(width, spec.width), h]} />
            <meshBasicMaterial map={textures[i]} transparent={spec.layer === 'near'} fog depthWrite={spec.layer !== 'near'} />
          </mesh>
        );
      })}
    </>
  );
}

/* ---------- Fallback procedural ---------- */

const rockVertex = /* glsl */ `
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const rockFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uReveal;
uniform float uSeed;
uniform float uContrast;
uniform float uMist;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec3 uFog;
uniform vec2 uSize;
varying vec3 vWorld;
varying vec2 vUv;
${NOISE_GLSL}
${PATH_LOOKUP_GLSL}
float heightAt(vec2 p) {
  float zig = sin(p.y * 0.28 + uSeed) * 2.4;
  float ledge = floor((p.y + zig) / 4.5);
  float terrace = fract((p.y + zig) / 4.5);
  float h = ridged(p * 0.22 + ledge * 1.7 + uSeed) * 0.65 + ridged(p * 0.9 + uSeed * 3.0) * 0.35;
  h += smoothstep(0.0, 0.14, terrace) * 0.45 - smoothstep(0.8, 1.0, terrace) * 0.3;
  return h;
}
void main() {
  vec2 p = vWorld.xy;
  float e = 0.08;
  float h = heightAt(p);
  float hx = heightAt(p + vec2(e, 0.0));
  float hy = heightAt(p + vec2(0.0, e));
  vec3 n = normalize(vec3((h - hx) / e * 0.9, (h - hy) / e * 0.9, 1.0));

  vec3 water = pathAtY(p.y);
  float dx = water.x - p.x;
  float d = abs(dx);
  vec3 L = normalize(vec3(sign(dx), 0.35, 0.55));
  float diff = max(dot(n, L), 0.0);
  float falloff = exp(-d * 0.42);
  float channel = 1.0 - smoothstep(0.5, 1.6, d);

  // Rocha basáltica escura e molhada: quase preta, só as arestas viradas para a água acendem.
  vec3 col = uBase * (0.35 + 0.65 * h * h);
  float rim = pow(diff, 2.2) * falloff * (0.25 + 0.75 * h) * uContrast;
  col += uRim * rim * (0.1 + 0.9 * uReveal);
  col += uRim * pow(diff, 10.0) * falloff * 0.5 * uReveal;
  col += uRim * 0.06 * falloff * uContrast * uReveal;
  col *= 1.0 - channel * 0.65;

  // Névoa em bolsões, mais densa embaixo dos degraus.
  float mist = fbm(p * 0.14 + vec2(uTime * 0.02, uTime * 0.01)) * uMist;
  mist *= 0.5 + 0.5 * falloff;
  col = mix(col, uFog * 1.6 + uRim * 0.05, clamp(mist, 0.0, 1.0) * 0.55);

  // Bordas do plano somem no fundo.
  float edge = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y) * smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
  col = mix(uFog, col, edge);
  gl_FragColor = vec4(col, 1.0);
}
`;

const silhouetteFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uReveal;
uniform float uSeed;
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec2 uSize;
varying vec3 vWorld;
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  vec2 p = vWorld.xy;
  float edge = uSize.x * 0.28 + noise(vec2(p.y * 0.35, uSeed)) * 2.4 + noise(vec2(p.y * 1.6, uSeed + 5.0)) * 0.6;
  float ax = abs(p.x);
  float alpha = smoothstep(edge - 0.35, edge + 0.35, ax);
  float rim = (1.0 - smoothstep(0.0, 1.4, ax - edge)) * (0.4 + 0.6 * noise(p * 0.8));
  vec3 col = uBase + uRim * rim * 0.35 * uReveal;
  float vertical = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
  gl_FragColor = vec4(col, alpha * vertical);
}
`;

function ProceduralPlate({ spec, height }: { spec: LayerSpec; height: number }) {
  const { path } = useWorldConfig();
  const isNear = spec.layer === 'near';
  const isFar = spec.layer === 'far';
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: rockVertex,
        fragmentShader: isNear ? silhouetteFragment : rockFragment,
        transparent: isNear,
        depthWrite: !isNear,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uSeed: { value: isFar ? 3.7 : 1.3 },
          uContrast: { value: isFar ? 0.45 : 1 },
          uMist: { value: isFar ? 0.9 : 0.35 },
          uFogNear: { value: 0 },
          uFogFar: { value: 0 },
          uBase: { value: new Color(isFar ? '#03070F' : isNear ? '#010306' : '#050B16') },
          uRim: { value: new Color(isFar ? '#1E63C4' : '#2E9BFF') },
          uFog: { value: new Color('#02050A') },
          uSize: { value: new Vector2(spec.width, height) },
          uPathTex: { value: path.texture },
          uPathRange: { value: new Vector2(PATH_Y_MIN, PATH_Y_MAX) },
        },
      }),
    [isNear, isFar, spec.width, height, path.texture],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uReveal.value = world.getState().reveal;
  });
  return (
    <mesh position={[0, (WORLD_TOP + WORLD_BOTTOM) / 2, 0]} material={material} renderOrder={isNear ? 6 : -1}>
      <planeGeometry args={[spec.width, height]} />
    </mesh>
  );
}

/* ---------- Camada com parallax ---------- */

function PlateLayer({ spec }: { spec: LayerSpec }) {
  const group = useRef<Group>(null);
  const tiles = useLayerTiles(spec);

  useFrame(() => {
    if (!group.current) return;
    // Fator (1 - parallax): a camada acompanha a câmera parcialmente (fundo) ou contra (frente).
    group.current.position.y = world.getState().camY * (1 - spec.parallax);
  });

  if (tiles === undefined) return null;
  return (
    <group ref={group} position={[0, 0, spec.z]}>
      {tiles ? <ImagePlate spec={spec} tiles={tiles} /> : <ProceduralPlate spec={spec} height={WORLD_H} />}
    </group>
  );
}

/** Três camadas de rocha: fundo em névoa, degraus por onde a água passa e silhuetas frontais. */
export function Plates() {
  return (
    <group>
      {LAYERS.map((spec) => (
        <PlateLayer key={spec.layer} spec={spec} />
      ))}
    </group>
  );
}
