import { cn } from '../../utils/classNames';

export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  inputClassName = '',
  as = 'input',
  children,
  ...props
}) {
  const Component = as;

  return (
    <label className={cn('block space-y-2', className)}>
      {label ? <span className="text-sm font-semibold text-muted dark:text-dark-muted">{label}</span> : null}
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        ) : null}
        <Component className={cn('soft-input', Icon && 'pl-10', error && 'border-danger', inputClassName)} {...props}>
          {children}
        </Component>
      </span>
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
