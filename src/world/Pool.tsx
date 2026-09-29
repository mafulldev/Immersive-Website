import { useEffect, useMemo } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { AdditiveBlending, Color, ShaderMaterial, Vector2, Vector4 } from 'three';
import { useWorldConfig } from './context';
import { POOL_Y } from './path';
import { makePoolGradient, makeRippleNormalMap } from './textures';
import { world } from '../store/world';

const RIPPLE_LIFE = 2.5;

const rippleVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const rippleFragment = /* glsl */ `
precision highp float;
uniform vec4 uRipples[4];
uniform float uTime;
uniform float uReveal;
uniform vec3 uColor;
uniform vec2 uImpact;
varying vec3 vWorld;
float gauss(float x) {
  return exp(-x * x);
}
void main() {
  float a = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w < 0.5 || age < 0.0 || age > ${RIPPLE_LIFE.toFixed(1)}) continue;
    float d = distance(vWorld.xz, r.xy);
    float front = age * 2.4;
    float ring = gauss((d - front) * 2.6) + 0.55 * gauss((d - front + 0.55) * 2.6) + 0.3 * gauss((d - front + 1.1) * 2.6);
    a += ring * (1.0 - age / ${RIPPLE_LIFE.toFixed(1)}) * 0.55;
  }
  float di = distance(vWorld.xz, uImpact);
  float rings = 0.5 + 0.5 * sin(di * 5.0 - uTime * 3.0);
  a += rings * exp(-di * 0.8) * 0.4;
  float fade = 1.0 - smoothstep(10.0, 24.0, length(vWorld.xz));
  gl_FragColor = vec4(uColor, a * fade * uReveal);
}
`;

/** O lago: produto estável em produção. Reflete a cachoeira; cliques geram ondas. */
export function Pool() {
  const { path, cfg } = useWorldConfig();
  const normalMap = useMemo(() => makeRippleNormalMap(), []);
  const gradient = useMemo(() => makePoolGradient(), []);
  const impact = path.points[path.points.length - 1];
  const clock = useThree((s) => s.clock);

  const rippleMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: rippleVertex,
        fragmentShader: rippleFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uRipples: { value: [new Vector4(), new Vector4(), new Vector4(), new Vector4()] },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uColor: { value: new Color('#2E9BFF') },
          uImpact: { value: new Vector2(impact.x, impact.z) },
        },
      }),
    [impact.x, impact.z],
  );

  useEffect(
    () => () => {
      normalMap.dispose();
      gradient.dispose();
      rippleMaterial.dispose();
    },
    [normalMap, gradient, rippleMaterial],
  );

  useFrame((state) => {
    const s = world.getState();
    const t = state.clock.elapsedTime;
    normalMap.offset.set(t * 0.012, t * 0.008);
    rippleMaterial.uniforms.uTime.value = t;
    rippleMaterial.uniforms.uReveal.value = s.reveal;
    const arr = rippleMaterial.uniforms.uRipples.value as Vector4[];
    for (let i = 0; i < 4; i += 1) {
      const r = s.ripples[i];
      if (r && t - r.t < RIPPLE_LIFE) arr[i].set(r.x, r.z, r.t, 1);
      else arr[i].set(0, 0, 0, 0);
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    world.getState().addRipple(e.point.x, e.point.z, clock.elapsedTime);
  };

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, POOL_Y, 0]} onPointerDown={onPointerDown} receiveShadow={false}>
        <planeGeometry args={[60, 40]} />
        {cfg.reflector ? (
          <MeshReflectorMaterial
            resolution={cfg.reflectorRes}
            blur={[300, 80]}
            mixBlur={1}
            mixStrength={1.4}
            roughness={0.85}
            metalness={0.5}
            color={new Color('#03070D')}
            normalMap={normalMap}
            normalScale={new Vector2(0.35, 0.35)}
            distortion={0.35}
            mirror={0.5}
            depthScale={0}
            minDepthThreshold={0.9}
            maxDepthThreshold={1}
          />
        ) : (
          <meshBasicMaterial map={gradient} />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, POOL_Y + 0.02, 0]} material={rippleMaterial} frustumCulled={false}>
        <planeGeometry args={[60, 40]} />
      </mesh>
    </group>
  );
}
