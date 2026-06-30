import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, ExternalLink, FileText, Link2 } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { trackAnalyticsEvent } from '../../services/analyticsService';
import { getProgressByResource, isSolvedProgressItem } from '../../services/progressService';
import { getResourceById, increaseResourceViewCount } from '../../services/resourceService';
import { getCategoryName } from '../../utils/categories';

export default function ResourceDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [resource, setResource] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResource() {
      if (!id || !currentUser?.uid) return;
      setLoading(true);
      try {
        const resourceItem = await getResourceById(id);
        const progressItem = resourceItem ? await getProgressByResource(currentUser.uid, id, resourceItem) : null;
        setResource(resourceItem);
        setProgress(progressItem);
        if (resourceItem) {
          increaseResourceViewCount(id).catch(() => {});
          trackAnalyticsEvent('resource_view', {
            resource_id: resourceItem.id,
            resource_title: resourceItem.title,
            category: resourceItem.category,
            publisher: resourceItem.publisher,
            grade_level: resourceItem.gradeLevel,
          }).catch(() => {});
        }
      } finally {
        setLoading(false);
      }
    }

    loadResource();
  }, [currentUser?.uid, id]);

  if (loading) return <LoadingSpinner label="Kaynak yükleniyor" />;
  if (!resource) return <EmptyState title="Kaynak bulunamadı" description="Aradığınız kaynak silinmiş veya erişime kapatılmış olabilir." />;

  const openURL = resource.fileURL || resource.externalLink;
  const isSolved = progress ? isSolvedProgressItem(progress) : false;

  return (
    <div className="space-y-6">
      <Button as={Link} to={`/category/${resource.category}`} variant="ghost" icon={ArrowLeft}>
        Kategoriye Dön
      </Button>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="aspect-[3/4] bg-gradient-to-br from-primary-soft via-secondary-soft to-tertiary-soft dark:from-primary/20 dark:via-blue-500/10 dark:to-emerald-500/10">
            {resource.coverImageURL ? (
              <img src={resource.coverImageURL} alt={resource.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-primary">
                <FileText className="h-20 w-20" />
              </div>
            )}
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge value="info">{getCategoryName(resource.category)}</Badge>
            <Badge value={progress?.status || 'not_started'} />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-ink dark:text-white">{resource.title}</h1>
          <p className="mt-4 text-muted dark:text-dark-muted">{resource.description}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ['Yayıncı', resource.publisher || '-'],
              ['Konu', resource.subject || '-'],
              ['Sınıf Seviyesi', resource.gradeLevel || '-'],
              ['Görüntülenme', resource.viewCount || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-low p-4 dark:bg-dark-surface">
                <dt className="text-xs font-bold uppercase text-outline dark:text-dark-muted">{label}</dt>
                <dd className="mt-1 font-semibold text-ink dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {openURL ? (
              <Button as="a" href={openURL} target="_blank" rel="noreferrer" icon={resource.fileURL ? FileText : Link2}>
                {resource.fileURL ? 'Dosyayı Aç' : 'Harici Bağlantıyı Aç'}
                <ExternalLink className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Dosya veya bağlantı eklenmemiş
              </Button>
            )}
            {isSolved ? (
              <Button variant="secondary" icon={ClipboardCheck} disabled>
                Test Çözüldü
              </Button>
            ) : openURL ? (
              <Button as={Link} to={`/resource/${id}/solve`} variant="primary" icon={ClipboardCheck}>
                Testi Çöz
              </Button>
            ) : (
              <Button variant="secondary" icon={ClipboardCheck} disabled>
                Testi Çöz
              </Button>
            )}
          </div>
          {progress ? (
            <div className="mt-5 rounded-xl bg-surface-low p-4 text-sm text-muted dark:bg-dark-surface dark:text-dark-muted">
              Son durum: <span className="font-bold text-ink dark:text-white">{progress.status === 'completed' ? 'Tamamlandı' : 'Devam ediyor'}</span>
              {typeof progress.score === 'number' ? ` · Puan: ${progress.score}` : ''}
              {progress.answeredCount ? ` · Cevaplanan: ${progress.answeredCount}/${progress.questionCount}` : ''}
            </div>
          ) : null}
        </div>
      </section>

    </div>
  );
}
