import { Link } from 'react-router-dom';
import { CalendarClock, ExternalLink, FileCheck2, FileText } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { getCategoryName } from '../../utils/categories';
import { formatDate } from '../../utils/formatDate';

function hasValidLink(link) {
  return typeof link === 'string' && /^https?:\/\//i.test(link);
}

export default function AssignmentCard({ assignment }) {
  const isCompleted = assignment.status === 'completed';
  const canOpenResource = Boolean(assignment.resourceId);
  const canOpenFile = hasValidLink(assignment.resourceLink);

  return (
    <article className="surface-card flex h-full flex-col p-5 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber dark:bg-orange-500/15 dark:text-orange-200">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <Badge value={isCompleted ? 'completed' : 'in_progress'}>{isCompleted ? 'Tamamlandı' : 'Atandı'}</Badge>
      </div>

      <div className="flex-1">
        <p className="text-xs font-bold uppercase text-outline dark:text-dark-muted">
          {getCategoryName(assignment.category)} · {assignment.sourceCollection || 'Ödev'}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-extrabold text-ink dark:text-white">
          {assignment.resourceTitle || 'İsimsiz ödev'}
        </h3>

        <div className="mt-4 grid gap-2 text-sm text-muted dark:text-dark-muted">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {assignment.questionCount || '-'} soru
          </span>
          <span className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-tertiary" />
            Atanma: {formatDate(assignment.assignedAt || assignment.createdAt)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {canOpenResource ? (
          <Button as={Link} to={`/resource/${assignment.resourceId}`} variant="outline" size="sm" className="flex-1">
            Detay
          </Button>
        ) : null}
        {canOpenFile ? (
          <Button
            as="a"
            href={assignment.resourceLink}
            target="_blank"
            rel="noreferrer"
            size="sm"
            icon={ExternalLink}
            className="flex-1"
          >
            Aç
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled className="flex-1">
            Link Yok
          </Button>
        )}
      </div>
    </article>
  );
}
