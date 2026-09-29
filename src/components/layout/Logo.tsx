import { BRAND } from '../../content/copy';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/** Gota facetada cujas metades formam "<" e ">". Gradiente blue-300 → blue-500. */
export function Logo({ size = 22, withWordmark = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="caudal-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7CC6FF" />
            <stop offset="1" stopColor="#2E9BFF" />
          </linearGradient>
        </defs>
        <path d="M12 1.5 4.5 10.5l2.7 2.1L12 8.4l4.8 4.2 2.7-2.1z" fill="url(#caudal-logo-g)" />
        <path d="M5.4 14.1 12 22.5l6.6-8.4-2.4.6L12 19.2l-4.2-4.5z" fill="url(#caudal-logo-g)" opacity="0.85" />
      </svg>
      {withWordmark && <span className="wordmark">{BRAND.name}</span>}
    </span>
  );
}
