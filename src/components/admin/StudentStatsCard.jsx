import { categoryMap } from '../../utils/categories';

export default function StudentStatsCard({ categoryId, total = 0, completed = 0 }) {
  const category = categoryMap[categoryId] || { name: categoryId };
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 dark:border-dark-border dark:bg-dark-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink dark:text-white">{category.name}</p>
        <span className="text-sm font-bold text-primary dark:text-primary-muted">%{percent}</span>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-extrabold text-ink dark:text-white">{completed}</p>
        <p className="text-xs font-semibold text-outline dark:text-dark-muted">Çözülen test</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-low dark:bg-dark-surface">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-outline dark:text-dark-muted">
        {total} toplam test içinde
      </p>
    </div>
  );
}
