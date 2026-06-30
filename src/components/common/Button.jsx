import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/classNames';

const variants = {
  primary: 'bg-primary text-white hover:bg-[#256fd1] shadow-soft',
  secondary:
    'bg-surface-low text-ink hover:bg-surface-border dark:bg-dark-surface dark:text-white dark:hover:bg-dark-border',
  outline:
    'border border-surface-border bg-white text-ink hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-card dark:text-white',
  ghost: 'text-muted hover:bg-surface-low hover:text-primary dark:text-dark-muted dark:hover:bg-dark-surface',
  danger: 'bg-danger text-white hover:bg-red-800',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export default function Button({
  children,
  as: Component = 'button',
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  const componentProps = Component === 'button' ? { type, disabled: disabled || loading } : {};

  return (
    <Component
      {...componentProps}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold outline-none transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </Component>
  );
}
