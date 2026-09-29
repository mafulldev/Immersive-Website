import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'nav' | 'circle';

interface BaseProps {
  variant?: Variant;
  icon?: IconName;
  iconOnly?: boolean;
  children?: ReactNode;
  className?: string;
}

type AnchorProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type NativeButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export type ButtonProps = AnchorProps | NativeButtonProps;

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  nav: 'btn btn--secondary btn--nav',
  circle: 'btn btn--circle',
};

/** Botão ou link com a mesma aparência. Renderiza <a> quando recebe href. */
export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { variant = 'primary', icon = 'ArrowRight', iconOnly = false, children, className = '', ...rest } = props;
  const cls = `${VARIANT_CLASS[variant]} ${className}`.trim();
  const content = (
    <>
      {!iconOnly && <span>{children}</span>}
      <Icon name={icon} size={iconOnly ? 18 : 16} className="btn__arrow" />
    </>
  );

  if ('href' in rest && typeof rest.href === 'string') {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={cls} {...anchorProps}>
        {content}
      </a>
    );
  }
  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" className={cls} {...buttonProps}>
      {content}
    </button>
  );
});
