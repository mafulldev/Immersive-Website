/** Ruído 2D compartilhado (hash, value noise, fbm, ridged). */
export const NOISE_GLSL = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.02 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}
float ridged(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * (1.0 - abs(noise(p) * 2.0 - 1.0));
    p = p * 2.1 + vec2(3.1, 7.7);
    a *= 0.5;
  }
  return v;
}
`;

/** Amostra x/z do caminho da água em função de y a partir da textura 1D (ver path.ts). */
export const PATH_LOOKUP_GLSL = /* glsl */ `
uniform sampler2D uPathTex;
uniform vec2 uPathRange; // (yMin, yMax)
vec3 pathAtY(float y) {
  float t = clamp((y - uPathRange.x) / (uPathRange.y - uPathRange.x), 0.0, 1.0);
  vec4 s = texture2D(uPathTex, vec2(t, 0.5));
  return vec3(s.r * 8.0 - 4.0, s.g * 8.0 - 4.0, s.b * 2.55);
}
`;
