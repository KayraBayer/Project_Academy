import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/classNames';

const toneClasses = {
  primary: 'bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted',
  secondary: 'bg-secondary-soft text-secondary dark:bg-blue-500/15 dark:text-blue-200',
  tertiary: 'bg-tertiary-soft text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
  rose: 'bg-rose-soft text-rose dark:bg-pink-500/15 dark:text-pink-200',
  amber: 'bg-amber-soft text-amber dark:bg-orange-500/15 dark:text-orange-200',
  danger: 'bg-danger-soft text-danger dark:bg-danger/15 dark:text-red-200',
};

export default function StatCard({ title, value, icon: Icon, trend, tone = 'primary', description }) {
  const isNegative = trend?.startsWith('-');

  return (
    <div className="surface-card p-5 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className={cn('grid h-11 w-11 place-items-center rounded-xl', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold',
              isNegative ? 'bg-danger-soft text-danger dark:bg-danger/15' : 'bg-tertiary/10 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
            )}
          >
            {isNegative ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {trend}
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        <p className="text-sm font-semibold text-outline dark:text-dark-muted">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-ink dark:text-white">{value}</p>
        {description ? <p className="mt-2 text-xs text-muted dark:text-dark-muted">{description}</p> : null}
      </div>
    </div>
  );
}
