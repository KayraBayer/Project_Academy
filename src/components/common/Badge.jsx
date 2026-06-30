import { cn } from '../../utils/classNames';

const variants = {
  active: 'bg-tertiary/10 text-tertiary border-tertiary/20 dark:bg-emerald-500/15 dark:text-emerald-200',
  passive: 'bg-surface-low text-outline border-surface-border dark:bg-dark-surface dark:text-dark-muted dark:border-dark-border',
  suspended: 'bg-danger-soft text-danger border-danger/20 dark:bg-danger/15 dark:text-red-200',
  draft: 'bg-amber-soft text-amber border-amber/20 dark:bg-orange-500/15 dark:text-orange-200',
  archived: 'bg-surface-low text-outline border-surface-border dark:bg-dark-surface dark:text-dark-muted dark:border-dark-border',
  completed: 'bg-tertiary/10 text-tertiary border-tertiary/20 dark:bg-emerald-500/15 dark:text-emerald-200',
  in_progress: 'bg-primary-soft text-primary border-primary/20 dark:bg-primary/15 dark:text-primary-muted',
  not_started: 'bg-secondary-soft text-secondary border-secondary/20 dark:bg-blue-500/15 dark:text-blue-200',
  info: 'bg-secondary-soft text-secondary border-secondary/20 dark:bg-blue-500/15 dark:text-blue-200',
};

const labels = {
  active: 'Aktif',
  passive: 'Pasif',
  suspended: 'Askıda',
  draft: 'Taslak',
  archived: 'Arşiv',
  completed: 'Tamamlandı',
  in_progress: 'Devam Ediyor',
  not_started: 'Başlanmadı',
  admin: 'Admin',
  student: 'Öğrenci',
  all: 'Tümü',
};

export default function Badge({ value = 'info', children, className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold',
        variants[value] || variants.info,
        className,
      )}
    >
      {children || labels[value] || value}
    </span>
  );
}
