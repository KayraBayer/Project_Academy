import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Kayıt bulunamadı',
  description = 'Gösterilecek veri bulunmuyor.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="surface-card flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-ink dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted dark:text-dark-muted">{description}</p>
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
