import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock3, Eye, FileText } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { getCategoryName } from '../../utils/categories';

function progressBadge(progress) {
  if (!progress) return { value: 'not_started', label: 'Başlanmadı', icon: Clock3 };
  if (progress.status === 'completed') return { value: 'completed', label: 'Tamamlandı', icon: CheckCircle2 };
  if (progress.status === 'in_progress') return { value: 'in_progress', label: 'Devam Ediyor', icon: BookOpen };
  return { value: 'not_started', label: 'Başlanmadı', icon: Clock3 };
}

export default function ResourceCard({ resource, progress }) {
  const badge = progressBadge(progress);
  const Icon = badge.icon;

  return (
    <article className="group surface-card flex h-full flex-col overflow-hidden hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-soft via-secondary-soft to-tertiary-soft dark:from-primary/20 dark:via-blue-500/10 dark:to-emerald-500/10">
        {resource.coverImageURL ? (
          <img
            src={resource.coverImageURL}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-primary">
            <FileText className="h-14 w-14" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur dark:bg-dark-card/90 dark:text-primary-muted">
            {resource.subject || 'Genel'}
          </span>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-tertiary shadow-sm backdrop-blur dark:bg-dark-card/90 dark:text-emerald-200">
            {resource.gradeLevel || 'Tüm Sınıflar'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase text-outline dark:text-dark-muted">{getCategoryName(resource.category)}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-bold text-ink group-hover:text-primary dark:text-white">
            {resource.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-muted dark:text-dark-muted">{resource.publisher || 'Yayıncı belirtilmedi'}</p>
        </div>

        <p className="line-clamp-3 flex-1 text-sm text-muted dark:text-dark-muted">
          {resource.description || 'Bu kaynak için açıklama eklenmemiş.'}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Badge value={badge.value}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {badge.label}
          </Badge>
          <Button as={Link} to={`/resource/${resource.id}`} variant="outline" size="sm" icon={Eye}>
            İncele
          </Button>
        </div>
      </div>
    </article>
  );
}
