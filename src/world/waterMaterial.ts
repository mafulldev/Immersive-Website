import { AdditiveBlending, Color, ShaderMaterial, Vector2 } from 'three';
import { NOISE_GLSL } from './shaders';
import { SEGMENTS } from './path';

export const WATER_COLORS = {
  deep: '#0E4FB8',
  mid: '#2E9BFF',
  core: '#D6EEFF',
  danger: '#FF4D4F',
} as const;

const vertex = /* glsl */ `
attribute float aFlow;
attribute float aFoam;
varying vec2 vUv;
varying float vFlow;
varying float vFoam;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vFlow = aFlow;
  vFoam = aFoam;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uSpeed;
uniform float uChaos;
uniform float uOrder;
uniform float uReveal;
uniform float uVelocity;
uniform float uPulseY;
uniform float uAlpha;
uniform float uGlitch;
uniform float uGlitchY;
uniform float uSegments;
uniform vec2 uMouse;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uCore;
uniform vec3 uDanger;
varying vec2 vUv;
varying float vFlow;
varying float vFoam;
varying vec3 vWorld;
${NOISE_GLSL}
void main() {
  vec2 uv = vUv;
  float t = uTime;

  // Ondulação senoidal do mouse: desloca uv.x em até .06 num raio de 1.2.
  float md = distance(vWorld.xy, uMouse);
  float mInf = smoothstep(1.2, 0.0, md);
  uv.x += sin(vWorld.y * 6.0 + t * 5.0) * 0.06 * mInf;

  // Glitch: faixa horizontal desloca uv.x e tinge de vermelho.
  float band = uGlitch * (1.0 - smoothstep(0.12, 0.3, abs(vWorld.y - uGlitchY)));
  uv.x += band * 0.12 * sign(sin(vWorld.y * 41.0));

  // Velocidade de scroll estica as estrias.
  float stretch = clamp(1.0 + abs(uVelocity) * 0.15, 1.0, 2.2);
  float fy = vFlow * 2.5;

  float amp = mix(0.25, 1.0, uChaos);
  float f = fbm(vec2(uv.x * 5.0, fy - t * uSpeed));
  float fluxo = clamp(0.5 + (f - 0.5) * amp * 1.8, 0.0, 1.0);

  float nE = noise(vec2(uv.x * 38.0, fy * 0.64 * stretch - t * uSpeed * 1.6));
  float estrias = smoothstep(0.6, 0.95, nE);
  // Ordem: estrias viram colunas regulares.
  float colunas = smoothstep(0.7, 1.0, sin(uv.x * 3.14159 * 24.0) * 0.5 + 0.5)
    * smoothstep(0.35, 0.8, noise(vec2(floor(uv.x * 24.0), fy * 0.5 - t * uSpeed * 1.4)));
  estrias = mix(estrias, colunas, uOrder * 0.65);

  float bordas = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
  float espuma = smoothstep(0.92, 1.0, uv.y) * (0.45 + 0.55 * noise(vec2(uv.x * 30.0, t * 3.0 + vFlow))) * vFoam;

  vec3 cor = mix(uDeep, uMid, fluxo) + uCore * estrias * 1.4;
  cor += uCore * espuma * 0.9;

  // Pulso azul que desce pela água (seção 03).
  float dp = (vWorld.y - uPulseY) * 1.1;
  float pulso = exp(-dp * dp);
  cor *= 1.0 + pulso;

  cor = mix(cor, uDanger * 1.6, band);

  // Ignição de cima para baixo com frente luminosa.
  // A frente passa além do fim do caminho quando uReveal chega a 1 (nada fica "parado" no lago).
  float flowN = vFlow / uSegments;
  float r = uReveal * 1.14;
  float rv = 1.0 - smoothstep(r - 0.06, r, flowN);
  float frente = smoothstep(r - 0.1, r - 0.02, flowN) * rv;
  cor += uCore * frente * 1.2;

  float alfa = bordas * (0.35 + fluxo * 0.65) * rv * uAlpha;
  alfa += espuma * bordas * 0.35 * rv * uAlpha;
  gl_FragColor = vec4(cor, alfa);
}
`;

export function createWaterMaterial(alpha = 1): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 1.4 },
      uChaos: { value: 1 },
      uOrder: { value: 0 },
      uReveal: { value: 0 },
      uVelocity: { value: 0 },
      uPulseY: { value: 999 },
      uAlpha: { value: alpha },
      uGlitch: { value: 0 },
      uGlitchY: { value: 0 },
      uSegments: { value: SEGMENTS },
      uMouse: { value: new Vector2(999, 999) },
      uDeep: { value: new Color(WATER_COLORS.deep) },
      uMid: { value: new Color(WATER_COLORS.mid) },
      uCore: { value: new Color(WATER_COLORS.core) },
      uDanger: { value: new Color(WATER_COLORS.danger) },
    },
  });
}
