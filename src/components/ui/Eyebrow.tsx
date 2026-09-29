import type { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Eyebrow({ children, className = '', id }: EyebrowProps) {
  return (
    <p id={id} className={`eyebrow ${className}`.trim()} data-eyebrow>
      {children}
    </p>
  );
}
