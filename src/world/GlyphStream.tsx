import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { useWorldConfig } from './context';
import { PATH_SAMPLES } from './path';
import { ATLAS_CELLS, makeGlyphAtlas } from './textures';
import { runtime } from './runtime';
import { world } from '../store/world';

const COLUMNS = 7;

const vertex = /* glsl */ `
attribute float aSeed;
attribute float aSpeed;
attribute float aGlyph;
attribute float aX;
attribute float aCol;
attribute float aRot;
uniform vec3 uPath[${PATH_SAMPLES}];
uniform float uTime;
uniform float uOrder;
uniform float uReveal;
uniform float uGlitch;
uniform float uGlitchY;
uniform float uLength;
uniform float uCols;
varying vec2 vUv;
varying float vRed;
varying float vFade;
void main() {
  float speed = mix(aSpeed, 1.8, uOrder);
  float jitter = sin(uTime * 2.0 + aSeed * 40.0) * 0.012 * (1.0 - uOrder);
  float f = fract(aSeed + uTime * speed / uLength + jitter);
  float idx = f * float(${PATH_SAMPLES - 1});
  int i0 = int(floor(idx));
  int i1 = min(i0 + 1, ${PATH_SAMPLES - 1});
  float fr = fract(idx);
  vec3 p = mix(uPath[i0], uPath[i1], fr);
  vec3 tangent = normalize(uPath[i1] - uPath[i0] + vec3(0.0, -0.0001, 0.0));
  vec3 side = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  float width = 0.9 + 0.7 * f;
  float colX = (aCol / (uCols - 1.0) - 0.5) * 0.85;
  float across = mix(aX, colX, uOrder);
  p += side * across * width * 0.5 + vec3(0.0, 0.0, 0.35);
  float rot = (aRot + sin(uTime + aSeed * 10.0) * 0.15) * (1.0 - uOrder);
  float vis = 1.0 - step(uReveal, f);
  vec2 q = position.xy;
  q = vec2(q.x * cos(rot) - q.y * sin(rot), q.x * sin(rot) + q.y * cos(rot)) * vis;
  vec4 wp = vec4(p + vec3(q, 0.0), 1.0);
  float cells = float(${ATLAS_CELLS});
  vUv = (uv + vec2(mod(aGlyph, cells), floor(aGlyph / cells))) / cells;
  vRed = uGlitch * (1.0 - smoothstep(0.3, 0.7, abs(p.y - uGlitchY))) * step(0.5, fract(aSeed * 7.31));
  vFade = smoothstep(0.0, 0.04, f) * (1.0 - smoothstep(0.96, 1.0, f));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uAtlas;
uniform vec3 uColor;
uniform vec3 uDanger;
uniform float uOpacity;
varying vec2 vUv;
varying float vRed;
varying float vFade;
void main() {
  float a = texture2D(uAtlas, vUv).a;
  vec3 c = mix(uColor, uDanger, vRed);
  gl_FragColor = vec4(c, a * vFade * uOpacity);
}
`;

/** A água é feita de código: quads instanciados caindo dentro do volume da cachoeira. */
export function GlyphStream() {
  const { path, cfg } = useWorldConfig();
  const count = cfg.glyphs;

  const atlas = useMemo(() => makeGlyphAtlas(), []);
  useEffect(() => {
    let cancelled = false;
    void document.fonts.load('500 40px "JetBrains Mono"').then(() => {
      if (cancelled) return;
      const fresh = makeGlyphAtlas();
      atlas.image = fresh.image;
      atlas.needsUpdate = true;
      fresh.dispose();
    });
    return () => {
      cancelled = true;
    };
  }, [atlas]);

  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(0.15, 0.15);
    const geo = new InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.getAttribute('position'));
    geo.setAttribute('uv', plane.getAttribute('uv'));
    const seed = new Float32Array(count);
    const speed = new Float32Array(count);
    const glyph = new Float32Array(count);
    const x = new Float32Array(count);
    const col = new Float32Array(count);
    const rot = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      seed[i] = Math.random();
      speed[i] = 1.2 + Math.random() * 1.2;
      glyph[i] = Math.floor(Math.random() * ATLAS_CELLS * ATLAS_CELLS);
      x[i] = (Math.random() - 0.5) * 0.95;
      col[i] = i % COLUMNS;
      rot[i] = (Math.random() - 0.5) * 0.6;
    }
    geo.setAttribute('aSeed', new InstancedBufferAttribute(seed, 1));
    geo.setAttribute('aSpeed', new InstancedBufferAttribute(speed, 1));
    geo.setAttribute('aGlyph', new InstancedBufferAttribute(glyph, 1));
    geo.setAttribute('aX', new InstancedBufferAttribute(x, 1));
    geo.setAttribute('aCol', new InstancedBufferAttribute(col, 1));
    geo.setAttribute('aRot', new InstancedBufferAttribute(rot, 1));
    geo.instanceCount = count;
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uPath: { value: Array.from({ length: PATH_SAMPLES }, (_, i) => new Vector3(path.samples[i * 3], path.samples[i * 3 + 1], path.samples[i * 3 + 2])) },
          uTime: { value: 0 },
          uOrder: { value: 0 },
          uReveal: { value: 0 },
          uGlitch: { value: 0 },
          uGlitchY: { value: 0 },
          uLength: { value: path.length },
          uCols: { value: COLUMNS },
          uAtlas: { value: atlas },
          uColor: { value: new Color('#9ED4FF') },
          uDanger: { value: new Color('#FF4D4F') },
          uOpacity: { value: 0.85 },
        },
      }),
    [path, atlas],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      atlas.dispose();
    },
    [geometry, material, atlas],
  );

  useFrame((state) => {
    const s = world.getState();
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uOrder.value = s.order;
    u.uReveal.value = s.reveal;
    u.uGlitch.value = runtime.glitch;
    u.uGlitchY.value = runtime.glitchY;
  });

  if (count === 0) return null;
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={4} />;
}
