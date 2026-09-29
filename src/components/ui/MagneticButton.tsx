import { useRef } from 'react';
import { Button, type ButtonProps } from './Button';
import { useMagnetic } from '../../hooks/useMagnetic';

interface MagneticButtonProps {
  radius?: number;
  strength?: number;
}

/** Botão primário magnético: raio 90px, força .25 (spec 9). */
export function MagneticButton({ radius = 90, strength = 0.25, ...props }: ButtonProps & MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  useMagnetic(ref, { radius, strength });
  return <Button ref={ref} {...props} />;
}
