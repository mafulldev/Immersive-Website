import { Icon, type IconName } from './Icon';

interface IconTileProps {
  name: IconName;
  lit?: boolean;
  className?: string;
}

export function IconTile({ name, lit = false, className = '' }: IconTileProps) {
  return (
    <span className={`tile ${lit ? 'tile--lit' : ''} ${className}`.trim()}>
      <Icon name={name} />
    </span>
  );
}
