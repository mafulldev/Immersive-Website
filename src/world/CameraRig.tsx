import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useWorldConfig } from './context';
import { world } from '../store/world';

const LAMBDA = 3.5;

/** Amortece a câmera até os alvos do store (λ = 3.5) e aplica parallax de mouse no desktop. */
export function CameraRig() {
  const { finePointer } = useWorldConfig();
  useFrame((state, delta) => {
    // Clamp largo: o damp é exponencial, então quadros longos (aba escondida, GPUs lentas) não estouram.
    const dt = Math.min(delta, 0.5);
    const s = world.getState();
    const cam = state.camera;
    const mx = finePointer ? s.mouse.x * 0.25 : 0;
    const my = finePointer ? s.mouse.y * 0.15 : 0;
    cam.position.x = MathUtils.damp(cam.position.x, mx, LAMBDA, dt);
    cam.position.y = MathUtils.damp(cam.position.y, s.camY + my, LAMBDA, dt);
    cam.position.z = MathUtils.damp(cam.position.z, s.camZ, LAMBDA, dt);
    cam.rotation.x = MathUtils.damp(cam.rotation.x, s.tilt, LAMBDA, dt);
  });
  return null;
}
