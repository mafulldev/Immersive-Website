import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, ShaderMaterial, SpriteMaterial, Vector3 } from 'three';
import { useWorldConfig } from './context';
import { NOISE_GLSL } from './shaders';
import { makeRadialTexture } from './textures';
import { world } from '../store/world';

const vertex = /* glsl */ `
varying vec3 vN;
varying vec3 vObjN;
varying vec2 vUv;
varying vec3 vView;
void main() {
  vUv = uv;
  vObjN = normal;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 uSize;
uniform float uTime;
uniform float uReveal;
uniform float uOffset;
uniform vec3 uBase;
uniform vec3 uWindow;
uniform vec3 uRim;
varying vec3 vN;
varying vec3 vObjN;
varying vec2 vUv;
varying vec3 vView;
${NOISE_GLSL}
void main() {
  vec3 n = abs(vObjN);
  vec2 cells = n.x > 0.5 ? vec2(uSize.z, uSize.y) : (n.z > 0.5 ? vec2(uSize.x, uSize.y) : vec2(0.0));
  vec3 col = uBase;
  if (cells.x > 0.0) {
    vec2 grid = vUv * cells * vec2(9.0, 7.0);
    vec2 cell = floor(grid);
    vec2 f = fract(grid);
    float h = hash21(cell + vObjN.xy * 13.0 + vObjN.z * 7.0 + uOffset);
    float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.7);
    float lit = step(0.66, h);
    float order = cell.y / (cells.y * 7.0);
    float on = smoothstep(order, order + 0.08, uReveal * 1.3 - 0.1);
    float flicker = 0.82 + 0.18 * sin(uTime * (2.0 + h * 4.0) + h * 40.0);
    float blink = step(0.985, noise(vec2(uTime * 0.7 + h * 10.0, h * 3.0)));
    col += uWindow * win * lit * on * flicker * (1.0 - blink) * (0.55 + 0.45 * h);
  }
  vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(normalize(vN), V), 0.0), 3.0);
  col += uRim * fres * 0.55 * uReveal;
  col += uRim * max(vObjN.y, 0.0) * 0.45 * uReveal;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Block {
  size: [number, number, number];
  offset: [number, number, number];
  seed: number;
}

const BLOCKS: Block[] = [
  { size: [1.3, 3.6, 1.3], offset: [0, 1.8, 0], seed: 1 },
  { size: [0.9, 2.8, 0.9], offset: [0.95, 1.4, -0.35], seed: 2 },
  { size: [0.6, 4.6, 0.6], offset: [-0.75, 2.3, -0.4], seed: 3 },
];

function createMonolithMaterial(size: [number, number, number], seed: number): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uSize: { value: new Vector3(...size) },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOffset: { value: seed * 17.3 },
      uBase: { value: new Color('#050B16') },
      uWindow: { value: new Color('#8ED0FF') },
      uRim: { value: new Color('#2E9BFF') },
    },
  });
}

/** O monólito de dados (a IA) acima da fonte da cachoeira. */
export function Monolith() {
  const { path } = useWorldConfig();
  const base = path.points[0];
  const materials = useMemo(() => BLOCKS.map((b) => createMonolithMaterial(b.size, b.seed)), []);
  const glowTexture = useMemo(() => makeRadialTexture(128, 0, 1.6), []);
  const glowMaterial = useMemo(
    () => new SpriteMaterial({ map: glowTexture, color: new Color('#2E9BFF'), transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0 }),
    [glowTexture],
  );

  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
      glowMaterial.dispose();
      glowTexture.dispose();
    },
    [materials, glowMaterial, glowTexture],
  );

  useFrame((state) => {
    const s = world.getState();
    materials.forEach((m) => {
      m.uniforms.uTime.value = state.clock.elapsedTime;
      m.uniforms.uReveal.value = s.reveal;
    });
    glowMaterial.opacity = 0.5 * Math.min(1, s.reveal * 2);
  });

  return (
    <group position={[base.x, base.y, base.z]}>
      {BLOCKS.map((b, i) => (
        <mesh key={b.seed} position={b.offset} material={materials[i]}>
          <boxGeometry args={b.size} />
        </mesh>
      ))}
      {/* Luz azul caindo sobre a água */}
      <sprite position={[0, -0.4, 0.6]} scale={[5, 3.5, 1]} material={glowMaterial} />
    </group>
  );
}
