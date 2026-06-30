import { Link } from 'react-router-dom';
import { Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';

export default function ResourceTable({ resources = [], onDelete, readOnly = false }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="animated-table w-full min-w-[960px] text-left">
          <thead className="table-header">
            <tr>
              <th className="px-5 py-4">Kapak</th>
              <th className="px-5 py-4">Başlık</th>
              <th className="px-5 py-4">Yayıncı</th>
              <th className="px-5 py-4">Konu</th>
              <th className="px-5 py-4">Sınıf</th>
              <th className="px-5 py-4">Soru</th>
              <th className="px-5 py-4">Oluşturma</th>
              <th className="px-5 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-dark-border">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-surface-low/70 dark:hover:bg-dark-surface">
                <td className="px-5 py-4">
                  <div className="grid h-16 w-12 place-items-center overflow-hidden rounded-lg bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted">
                    {resource.coverImageURL ? (
                      <img src={resource.coverImageURL} alt={resource.title} className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="max-w-xs truncate font-bold text-ink dark:text-white">{resource.title}</p>
                  <p className="max-w-xs truncate text-xs text-outline dark:text-dark-muted">{resource.testId || resource.uniqueId}</p>
                </td>
                <td className="px-5 py-4 text-sm text-muted dark:text-dark-muted">{resource.publisher || '-'}</td>
                <td className="px-5 py-4 text-sm text-muted dark:text-dark-muted">{resource.subject || '-'}</td>
                <td className="px-5 py-4 text-sm font-semibold text-ink dark:text-white">{resource.gradeLevel || '-'}</td>
                <td className="px-5 py-4 text-sm font-semibold text-ink dark:text-white">{resource.questionCount || '-'}</td>
                <td className="px-5 py-4 text-sm text-outline dark:text-dark-muted">{formatDate(resource.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button as={Link} to={`/admin/resources/view/${resource.id}`} variant="ghost" size="sm" icon={Eye}>
                      Görüntüle
                    </Button>
                    {!readOnly ? (
                      <>
                        <Button as={Link} to={`/admin/resources/edit/${resource.id}`} variant="ghost" size="sm" icon={Pencil}>
                          Düzenle
                        </Button>
                        <Button variant="ghost" size="sm" icon={Trash2} className="text-danger" onClick={() => onDelete(resource)}>
                          Sil
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
