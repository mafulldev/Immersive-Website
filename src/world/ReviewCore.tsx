import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { CORE_POSITION, CORE_RADIUS } from './path';
import { makeRadialTexture } from './textures';
import { world } from '../store/world';
import { useWorldConfig } from './context';

const POINTS = 1600;
const NEIGHBOR_DIST = 0.45;
const RED = new Color('#FF4D4F');
const BLUE = new Color('#2E9BFF');

const NODE_DIRECTIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-1.4, 1.6, 1.6],
  [1.8, 0.9, 1.6],
  [-1.9, -0.5, 1.7],
  [0.9, -1.7, 1.7],
  [0.2, 0.3, 2.55],
];

const pointsVertex = /* glsl */ `
uniform float uSize;
uniform float uHeight;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uHeight / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const pointsFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.2, d) * uAlpha;
  gl_FragColor = vec4(uColor, a);
}
`;
const fresnelVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  vPos = position;
  gl_Position = projectionMatrix * mv;
}
`;
const fresnelFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uTime;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
void main() {
  float fres = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
  float scan = 0.5 + 0.5 * sin(vPos.y * 30.0 - uTime * 2.0);
  float a = fres * 0.75 + scan * 0.025;
  gl_FragColor = vec4(uColor, a * uAlpha);
}
`;

function fibonacciSphere(n: number, r: number): Float32Array {
  const arr = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const theta = phi * i;
    arr[i * 3] = Math.cos(theta) * rad * r;
    arr[i * 3 + 1] = y * r;
    arr[i * 3 + 2] = Math.sin(theta) * rad * r;
  }
  return arr;
}

function neighborLines(points: Float32Array, maxDist: number): Float32Array {
  const out: number[] = [];
  const n = points.length / 3;
  const d2 = maxDist * maxDist;
  for (let i = 0; i < n; i += 1) {
    const ax = points[i * 3];
    const ay = points[i * 3 + 1];
    const az = points[i * 3 + 2];
    for (let j = i + 1; j < n; j += 1) {
      const dx = ax - points[j * 3];
      const dy = ay - points[j * 3 + 1];
      const dz = az - points[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < d2) {
        out.push(ax, ay, az, points[j * 3], points[j * 3 + 1], points[j * 3 + 2]);
      }
    }
  }
  return new Float32Array(out);
}

/** O Núcleo de Revisão: esfera holográfica onde os problemas são detectados e corrigidos. */
export function ReviewCore() {
  const { finePointer, mobile } = useWorldConfig();
  const cloud = useRef<Group>(null);
  const nodesGroup = useRef<Group>(null);
  const rings = useRef<Array<Mesh | null>>([]);
  const nodes = useRef<Array<Mesh | null>>([]);
  const halos = useRef<Array<Sprite | null>>([]);
  const waves = useRef<Array<Mesh | null>>([]);

  const positions = useMemo(() => fibonacciSphere(POINTS, CORE_RADIUS), []);
  const pointsGeometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const linesGeometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(neighborLines(positions, NEIGHBOR_DIST), 3));
    return g;
  }, [positions]);

  const pointsMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: pointsVertex,
        fragmentShader: pointsFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uSize: { value: 0.03 }, uHeight: { value: 1000 }, uColor: { value: new Color('#7CC6FF') }, uAlpha: { value: 0.7 } },
      }),
    [],
  );
  const linesMaterial = useMemo(
    () => new LineBasicMaterial({ color: new Color('#7CC6FF'), transparent: true, opacity: 0.15, blending: AdditiveBlending, depthWrite: false }),
    [],
  );
  const ringMaterial = useMemo(
    () => new MeshBasicMaterial({ color: new Color('#7CC6FF'), transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false }),
    [],
  );
  const fresnelMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: fresnelVertex,
        fragmentShader: fresnelFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color('#2E9BFF') }, uTime: { value: 0 }, uAlpha: { value: 1 } },
      }),
    [],
  );
  const haloTexture = useMemo(() => makeRadialTexture(64, 0, 2), []);
  const nodeMaterials = useMemo(
    () =>
      NODE_DIRECTIONS.map(() => ({
        sphere: new MeshBasicMaterial({ color: RED.clone(), toneMapped: false }),
        halo: new SpriteMaterial({ map: haloTexture, color: RED.clone(), transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.6 }),
        wave: new MeshBasicMaterial({ color: BLUE.clone(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: 2 }),
      })),
    [haloTexture],
  );
  const nodePositions = useMemo(
    () => NODE_DIRECTIONS.map(([x, y, z]) => new Vector3(x, y, z).normalize().multiplyScalar(CORE_RADIUS)),
    [],
  );

  useEffect(
    () => () => {
      pointsGeometry.dispose();
      linesGeometry.dispose();
      pointsMaterial.dispose();
      linesMaterial.dispose();
      ringMaterial.dispose();
      fresnelMaterial.dispose();
      haloTexture.dispose();
      nodeMaterials.forEach((m) => {
        m.sphere.dispose();
        m.halo.dispose();
        m.wave.dispose();
      });
    },
    [pointsGeometry, linesGeometry, pointsMaterial, linesMaterial, ringMaterial, fresnelMaterial, haloTexture, nodeMaterials],
  );

  const tmpColor = useMemo(() => new Color(), []);

  useFrame((state, dt) => {
    const s = world.getState();
    const t = state.clock.elapsedTime;
    const cam = state.camera as PerspectiveCamera;
    pointsMaterial.uniforms.uHeight.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan((cam.fov * Math.PI) / 360));
    fresnelMaterial.uniforms.uTime.value = t;
    const appear = Math.min(1, s.reveal * 1.5);
    pointsMaterial.uniforms.uAlpha.value = 0.7 * appear;
    linesMaterial.opacity = 0.15 * appear;
    fresnelMaterial.uniforms.uAlpha.value = appear;

    if (cloud.current) {
      cloud.current.rotation.y += 0.08 * Math.min(dt, 0.1);
      const targetX = finePointer ? -s.mouse.y * 0.15 : 0;
      const targetZ = finePointer ? s.mouse.x * 0.15 : 0;
      cloud.current.rotation.x += (targetX - cloud.current.rotation.x) * 0.05;
      cloud.current.rotation.z += (targetZ - cloud.current.rotation.z) * 0.05;
    }
    if (nodesGroup.current) {
      nodesGroup.current.rotation.y = Math.sin(t * 0.25) * 0.18 + (finePointer ? s.mouse.x * 0.15 : 0);
      nodesGroup.current.rotation.x = Math.cos(t * 0.2) * 0.1 + (finePointer ? -s.mouse.y * 0.1 : 0);
    }
    const speeds = [0.05, 0.08, 0.12];
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.x += speeds[i] * dt * (i === 1 ? -1 : 1);
      ring.rotation.y += speeds[(i + 1) % 3] * dt * 0.6;
    });

    NODE_DIRECTIONS.forEach((_, i) => {
      const local = Math.min(1, Math.max(0, s.resolved - i));
      const pulseAmt = local <= 0 ? 0 : local < 0.5 ? 1 : 1 - (local - 0.5) * 2;
      const mixTo = local < 0.5 ? 0 : (local - 0.5) * 2;
      tmpColor.copy(RED).lerp(BLUE, mixTo);
      const mats = nodeMaterials[i];
      mats.sphere.color.copy(tmpColor);
      mats.halo.color.copy(tmpColor);
      const scale = 1 + 0.6 * pulseAmt * (0.5 + 0.5 * Math.sin(t * 6));
      const node = nodes.current[i];
      const halo = halos.current[i];
      const wave = waves.current[i];
      if (node) node.scale.setScalar(scale);
      if (halo) {
        const h = (0.5 + 0.9 * pulseAmt + (local >= 1 ? 0.15 : 0)) * scale;
        halo.scale.set(h, h, 1);
        mats.halo.opacity = (0.45 + 0.4 * pulseAmt) * appear;
      }
      if (wave) {
        const w = mixTo;
        wave.visible = w > 0 && w < 1;
        wave.scale.setScalar(1 + 10 * w);
        mats.wave.opacity = (1 - w) * 0.8;
        wave.lookAt(state.camera.position);
      }
      if (node) node.visible = appear > 0.2;
    });
  });

  return (
    <group position={[CORE_POSITION[0], CORE_POSITION[1], CORE_POSITION[2]]} scale={mobile ? 0.68 : 1}>
      <group ref={cloud}>
        <points geometry={pointsGeometry} material={pointsMaterial} frustumCulled={false} />
        <lineSegments geometry={linesGeometry} material={linesMaterial} frustumCulled={false} />
      </group>
      <mesh material={fresnelMaterial} renderOrder={2}>
        <sphereGeometry args={[CORE_RADIUS, 48, 32]} />
      </mesh>
      {/* Anéis nas proporções da spec (3.2 / 3.6 / 4.1 para raio 2.6), escalados ao raio atual. */}
      {[1.23, 1.385, 1.577].map((k) => k * CORE_RADIUS).map((r, i) => (
        <mesh
          key={r}
          ref={(m) => {
            rings.current[i] = m;
          }}
          rotation={[Math.PI / 2 + i * 0.5, i * 0.7, i * 0.3]}
          material={ringMaterial}
        >
          <torusGeometry args={[r, 0.004, 6, 160]} />
        </mesh>
      ))}
      <group ref={nodesGroup}>
        {nodePositions.map((p, i) => (
          <group key={NODE_DIRECTIONS[i].join(',')} position={p}>
            <mesh
              ref={(m) => {
                nodes.current[i] = m;
              }}
              material={nodeMaterials[i].sphere}
            >
              <sphereGeometry args={[0.08, 16, 12]} />
            </mesh>
            <sprite
              ref={(sp) => {
                halos.current[i] = sp;
              }}
              material={nodeMaterials[i].halo}
              scale={[0.6, 0.6, 1]}
            />
            <mesh
              ref={(m) => {
                waves.current[i] = m;
              }}
              material={nodeMaterials[i].wave}
              visible={false}
            >
              <ringGeometry args={[0.1, 0.125, 48]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
