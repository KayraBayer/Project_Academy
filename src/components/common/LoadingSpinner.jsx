import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Yükleniyor' }) {
  return (
    <div className="flex items-center justify-center gap-3 text-muted dark:text-dark-muted">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
