import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group, SpriteMaterial, Vector3 } from 'three';
import { useWorldConfig } from './context';
import { IMPACT_INDICES, SEGMENTS, widthAt, type WaterPath } from './path';
import { createWaterMaterial } from './waterMaterial';
import { makeRadialTexture } from './textures';
import { runtime, updateGlitch } from './runtime';
import { world } from '../store/world';

const ROWS = 48;
const WATER_Z = -2;

/** Constrói todas as faixas (uma por trecho, 1×48) num único BufferGeometry. */
function buildRibbons(path: WaterPath, widthScale: number, zOffset: number, foam: number): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const flows: number[] = [];
  const foams: number[] = [];
  const indices: number[] = [];
  const up = new Vector3(0, 0, 1);
  const side = new Vector3();
  const impacts = new Set<number>(IMPACT_INDICES);
  for (let s = 0; s < SEGMENTS; s += 1) {
    const base = positions.length / 3;
    // Espuma forte só onde a água bate num degrau (fim de trecho que é ponto de impacto).
    const strength = foam * (impacts.has(s + 1) ? 1 : 0.3);
    for (let j = 0; j <= ROWS; j += 1) {
      const local = j / ROWS;
      const t = (s + local) / SEGMENTS;
      const p = path.curve.getPoint(t);
      const tan = path.curve.getTangent(t);
      side.crossVectors(tan, up).normalize();
      const w = widthAt(t) * widthScale * 0.5;
      positions.push(p.x - side.x * w, p.y - side.y * w, p.z + zOffset, p.x + side.x * w, p.y + side.y * w, p.z + zOffset);
      uvs.push(0, local, 1, local);
      flows.push(s + local, s + local);
      foams.push(strength, strength);
      if (j < ROWS) {
        const a = base + j * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geo.setAttribute('aFlow', new BufferAttribute(new Float32Array(flows), 1));
  geo.setAttribute('aFoam', new BufferAttribute(new Float32Array(foams), 1));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

const tmp = new Vector3();

export function Waterfall() {
  const { path, finePointer } = useWorldConfig();
  const group = useRef<Group>(null);

  const geometries = useMemo(
    () => ({
      main: buildRibbons(path, 1.5, 0, 1),
      veilA: buildRibbons(path, 2.5, -0.35, 0),
      veilB: buildRibbons(path, 3.6, -0.7, 0),
    }),
    [path],
  );
  const materials = useMemo(() => ({ main: createWaterMaterial(1), veilA: createWaterMaterial(0.3), veilB: createWaterMaterial(0.16) }), []);
  const glowTexture = useMemo(() => makeRadialTexture(128, 0, 2), []);
  const glowMaterial = useMemo(
    () =>
      new SpriteMaterial({ map: glowTexture, color: new Color('#2E9BFF'), transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0 }),
    [glowTexture],
  );
  const glowPositions = useMemo(() => {
    const n = 18;
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const p = path.curve.getPoint(t);
      return [p.x, p.y, p.z + 0.4, 4.2 + widthAt(t) * 2.2] as const;
    });
  }, [path]);

  useEffect(() => {
    Object.values(materials).forEach((m) => {
      m.side = DoubleSide;
    });
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      glowMaterial.dispose();
      glowTexture.dispose();
    };
  }, [geometries, materials, glowMaterial, glowTexture]);

  useFrame((state, dt) => {
    const s = world.getState();
    const time = state.clock.elapsedTime;
    runtime.time = time;
    updateGlitch(Math.min(dt, 0.1), s.chaos, s.camY);

    // Mouse em coordenadas de mundo no plano da água.
    let mx = 999;
    let my = 999;
    if (finePointer) {
      tmp.set(s.mouse.x, s.mouse.y, 0.5).unproject(state.camera);
      tmp.sub(state.camera.position).normalize();
      const dist = (WATER_Z - state.camera.position.z) / tmp.z;
      mx = state.camera.position.x + tmp.x * dist;
      my = state.camera.position.y + tmp.y * dist;
    }

    Object.values(materials).forEach((m) => {
      const u = m.uniforms;
      u.uTime.value = time;
      u.uChaos.value = s.chaos;
      u.uOrder.value = s.order;
      u.uReveal.value = s.reveal;
      u.uVelocity.value = s.velocity;
      u.uPulseY.value = s.pulseY;
      u.uGlitch.value = runtime.glitch;
      u.uGlitchY.value = runtime.glitchY;
      u.uMouse.value.set(mx, my);
    });
    glowMaterial.opacity = 0.35 * Math.min(1, s.reveal * 1.4) * (1 + (s.pulseY < 900 ? 0.15 : 0));
  });

  return (
    <group ref={group}>
      <mesh geometry={geometries.main} material={materials.main} frustumCulled={false} renderOrder={3} />
      <mesh geometry={geometries.veilA} material={materials.veilA} frustumCulled={false} renderOrder={2} />
      <mesh geometry={geometries.veilB} material={materials.veilB} frustumCulled={false} renderOrder={1} />
      {glowPositions.map(([x, y, z, scale]) => (
        <sprite key={`${x}-${y}`} position={[x, y, z]} scale={[scale, scale * 1.15, 1]} material={glowMaterial} renderOrder={0} />
      ))}
    </group>
  );
}
