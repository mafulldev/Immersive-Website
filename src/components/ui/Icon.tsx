import {
  Activity,
  ArrowDown,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Code2,
  FlaskConical,
  Gauge,
  Layers,
  Lock,
  Radar,
  Rocket,
  Route,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  Users,
  Wrench,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const ICONS = {
  Activity,
  ArrowDown,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Code2,
  FlaskConical,
  Gauge,
  Layers,
  Lock,
  Radar,
  Rocket,
  Route,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  Users,
  Wrench,
} satisfies Record<string, ComponentType<LucideProps>>;

export type IconName = keyof typeof ICONS;

interface IconProps extends LucideProps {
  name: IconName;
}

/** Ícone Lucide padrão da marca: stroke 1.5, 18px. */
export function Icon({ name, size = 18, strokeWidth = 1.5, ...rest }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...rest} />;
}

/** Logos de redes sociais (não existem no Lucide). 16px. */
export function SocialIcon({ name }: { name: 'Linkedin' | 'XLogo' | 'Youtube' | 'Github' }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;
  switch (name) {
    case 'Linkedin':
      return (
        <svg {...common}>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
      );
    case 'XLogo':
      return (
        <svg {...common}>
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
        </svg>
      );
    case 'Youtube':
      return (
        <svg {...common}>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
        </svg>
      );
    case 'Github':
      return (
        <svg {...common}>
          <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
        </svg>
      );
  }
}
