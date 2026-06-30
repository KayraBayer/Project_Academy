import { X } from 'lucide-react';
import { cn } from '../../utils/classNames';

export default function Modal({
  open,
  title,
  children,
  onClose,
  className = '',
  bodyClassName = 'p-5',
  wrapperClassName = 'p-4',
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        aria-label="Kapat"
        className="fixed inset-0 h-full w-full bg-ink/35 backdrop-blur-sm dark:bg-black/50"
        onClick={onClose}
      />
      <div className={cn('flex min-h-full items-center justify-center', wrapperClassName)}>
        <div className={cn('surface-card relative z-10 w-full max-w-xl overflow-hidden', className)}>
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4 dark:border-dark-border">
            <h2 className="text-lg font-bold text-ink dark:text-white">{title}</h2>
            <button className="icon-button" onClick={onClose} aria-label="Kapat">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}
