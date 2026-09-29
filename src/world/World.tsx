import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { ACESFilmicToneMapping, Color, FogExp2, SRGBColorSpace } from 'three';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { world, useWorld, type Tier } from '../store/world';
import { TIER_CONFIG, degradeTier, upgradeTier } from '../hooks/useTier';
import { WorldContext, type WorldConfig } from './context';
import { createWaterPath } from './path';
import { CameraRig } from './CameraRig';
import { Plates } from './Plates';
import { Monolith } from './Monolith';
import { Waterfall } from './Waterfall';
import { GlyphStream } from './GlyphStream';
import { Mist } from './Mist';
import { ReviewCore } from './ReviewCore';
import { Pool } from './Pool';
import { Effects } from './Effects';

const BG = '#02050A';

/** Marca o primeiro frame (crossfade do poster), dispara a ignição e o refresh do ScrollTrigger. */
function Ignition() {
  const frames = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) {
      world.getState().setReady(true);
      ScrollTrigger.refresh();
      const obj = { v: 0 };
      gsap.to(obj, {
        v: 1,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: () => world.setState({ reveal: obj.v }),
      });
      invalidate();
    }
  });
  return null;
}

function Scene({ initialTier }: { initialTier: Tier }) {
  return (
    <PerformanceMonitor
      ms={250}
      iterations={8}
      flipflops={3}
      onDecline={() => degradeTier()}
      onIncline={() => upgradeTier(initialTier)}
      onFallback={() => world.getState().setTier('low')}
    >
      <CameraRig />
      <Plates />
      <Monolith />
      <Waterfall />
      <GlyphStream />
      <Mist />
      <ReviewCore />
      <Pool />
      <Effects />
      <Ignition />
    </PerformanceMonitor>
  );
}

export default function World() {
  const tier = useWorld((s) => s.tier);
  const initialTier = useRef(tier);
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const config = useMemo<WorldConfig>(() => {
    const mobile = window.innerWidth < 1024;
    return {
      path: createWaterPath(mobile ? 0.3 : 1),
      tier,
      cfg: TIER_CONFIG[tier],
      mobile,
      finePointer: window.matchMedia('(pointer: fine)').matches,
    };
  }, [tier]);

  useEffect(() => () => config.path.texture.dispose(), [config]);

  return (
    <WorldContext.Provider value={config}>
      <Canvas
        dpr={config.cfg.dpr}
        frameloop={hidden ? 'never' : 'always'}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ fov: 35, position: [0, 0, 12], near: 0.1, far: 90 }}
        onCreated={(state) => {
          const { gl, scene } = state;
          scene.background = new Color(BG);
          scene.fog = new FogExp2(BG, 0.035);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = SRGBColorSpace;
          if (import.meta.env.DEV || location.search.includes('debug')) {
            (window as unknown as { __r3f: unknown }).__r3f = state;
          }
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.35} color="#1E63C4" />
        <Scene initialTier={initialTier.current} />
      </Canvas>
    </WorldContext.Provider>
  );
}
