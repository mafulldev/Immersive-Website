import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PerspectiveCamera, ShaderMaterial, Vector2, Vector3 } from 'three';
import { useWorldConfig } from './context';
import { world } from '../store/world';

const PER_IMPACT = 500;
const DUST = 300;

const mistVertex = /* glsl */ `
attribute float aSeed;
attribute float aLife;
attribute float aAngle;
attribute float aRadius;
attribute float aImpact;
uniform vec3 uImpacts[4];
uniform float uTime;
uniform float uReveal;
uniform float uHeight;
varying float vAlpha;
void main() {
  vec3 origin = uImpacts[int(aImpact)];
  float age = fract(uTime / aLife + aSeed);
  float spread = age * aRadius;
  vec3 p = origin + vec3(cos(aAngle) * spread * 1.4, age * 1.7 - 0.25, sin(aAngle) * spread * 0.5 + 0.4);
  float size = mix(0.05, 0.18, age);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = size * uHeight / -mv.z;
  vAlpha = 0.25 * (1.0 - age) * smoothstep(0.0, 0.15, age) * uReveal;
  gl_Position = projectionMatrix * mv;
}
`;

const dustVertex = /* glsl */ `
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uHeight;
uniform vec2 uMouse;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.25 + aSeed * 12.0) * 0.35;
  p.y += sin(uTime * 0.18 + aSeed * 7.0) * 0.25;
  p.xy += uMouse * (p.z + 3.5) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uHeight / -mv.z;
  vAlpha = 0.5 * (0.6 + 0.4 * sin(uTime * 1.5 + aSeed * 30.0));
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(uColor, a * vAlpha);
}
`;

function heightFactor(camera: PerspectiveCamera, height: number, dpr: number): number {
  return (height * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
}

/** Névoa nos 4 pontos de impacto + poeira de dados flutuando com parallax. */
export function Mist() {
  const { path, cfg } = useWorldConfig();
  const mistCount = Math.round(PER_IMPACT * cfg.particles) * path.impacts.length;

  const mistGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(mistCount * 3);
    const seed = new Float32Array(mistCount);
    const life = new Float32Array(mistCount);
    const angle = new Float32Array(mistCount);
    const radius = new Float32Array(mistCount);
    const impact = new Float32Array(mistCount);
    for (let i = 0; i < mistCount; i += 1) {
      seed[i] = Math.random();
      life[i] = 1.6 + Math.random() * 1.8;
      angle[i] = Math.random() * Math.PI * 2;
      radius[i] = 0.4 + Math.random() * 1.2;
      impact[i] = i % path.impacts.length;
    }
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    geo.setAttribute('aLife', new BufferAttribute(life, 1));
    geo.setAttribute('aAngle', new BufferAttribute(angle, 1));
    geo.setAttribute('aRadius', new BufferAttribute(radius, 1));
    geo.setAttribute('aImpact', new BufferAttribute(impact, 1));
    return geo;
  }, [mistCount, path.impacts.length]);

  const dustGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(DUST * 3);
    const seed = new Float32Array(DUST);
    const size = new Float32Array(DUST);
    for (let i = 0; i < DUST; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = 6 - Math.random() * 48;
      pos[i * 3 + 2] = -3 + Math.random() * 7;
      seed[i] = Math.random();
      size[i] = 0.02 + Math.random() * 0.04;
    }
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    geo.setAttribute('aSize', new BufferAttribute(size, 1));
    return geo;
  }, []);

  const mistMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: mistVertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uImpacts: { value: path.impacts.map((p) => new Vector3(p.x, p.y, p.z)) },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uHeight: { value: 1000 },
          uColor: { value: new Color('#7CC6FF') },
        },
      }),
    [path],
  );

  const dustMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: dustVertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uHeight: { value: 1000 },
          uMouse: { value: new Vector2() },
          uColor: { value: new Color('#7CC6FF') },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      mistGeometry.dispose();
      dustGeometry.dispose();
      mistMaterial.dispose();
      dustMaterial.dispose();
    },
    [mistGeometry, dustGeometry, mistMaterial, dustMaterial],
  );

  useFrame((state) => {
    const s = world.getState();
    const cam = state.camera as PerspectiveCamera;
    const h = heightFactor(cam, state.size.height, state.viewport.dpr);
    mistMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    mistMaterial.uniforms.uReveal.value = s.reveal;
    mistMaterial.uniforms.uHeight.value = h;
    dustMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    dustMaterial.uniforms.uHeight.value = h;
    dustMaterial.uniforms.uMouse.value.set(s.mouse.x, s.mouse.y);
  });

  return (
    <group>
      {mistCount > 0 && <points geometry={mistGeometry} material={mistMaterial} frustumCulled={false} renderOrder={5} />}
      <points geometry={dustGeometry} material={dustMaterial} frustumCulled={false} renderOrder={5} />
    </group>
  );
}
