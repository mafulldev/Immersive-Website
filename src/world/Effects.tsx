import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { useWorldConfig } from './context';

/** Bloom (mipmapBlur), grão e vinheta. Meia resolução no tier médio, sem bloom no baixo. */
export function Effects() {
  const { cfg } = useWorldConfig();
  if (!cfg.bloom) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Noise opacity={0.035} />
        <Vignette offset={0.28} darkness={0.9} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.18} luminanceSmoothing={0.3} resolutionScale={cfg.bloomScale} />
      <Noise opacity={0.035} />
      <Vignette offset={0.28} darkness={0.9} />
    </EffectComposer>
  );
}
