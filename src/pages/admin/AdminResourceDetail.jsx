import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ExternalLink, FileText, Pencil } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getResourceById } from '../../services/resourceService';
import { getCategoryName } from '../../utils/categories';
import { formatDate } from '../../utils/formatDate';

function drivePreviewUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes('drive.google.com')) {
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      const id = fileMatch?.[1] || parsed.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
  } catch {
    return value;
  }

  return value;
}

function normalizeAnswerKey(value) {
  return String(value || '')
    .toLocaleUpperCase('tr-TR')
    .replace(/[^ABCD]/g, '')
    .split('');
}

export default function AdminResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResource() {
      setLoading(true);
      try {
        setResource(await getResourceById(id));
      } finally {
        setLoading(false);
      }
    }

    loadResource();
  }, [id]);

  if (loading) return <LoadingSpinner label="Test yükleniyor" />;
  if (!resource) return <EmptyState title="Test bulunamadı" description="Görüntülemek istediğiniz test bulunamadı." />;

  const fileUrl = resource.fileURL || resource.externalLink || resource.link || '';
  const previewUrl = drivePreviewUrl(fileUrl);
  const answerKey = normalizeAnswerKey(resource.answerKey);
  const answerKeyText = answerKey.join('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button as={Link} to={`/admin/resources/${resource.category}/publisher/${encodeURIComponent(resource.publisher)}`} variant="ghost" icon={ArrowLeft}>
            Listeye Dön
          </Button>
          <p className="mt-4 text-sm font-bold text-primary dark:text-primary-muted">Test Yönetimi</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{resource.title}</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            {resource.publisher} yayıncısına ait test detayları ve dosya önizlemesi.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button as={Link} to={`/admin/resources/edit/${resource.id}`} variant="outline" icon={Pencil}>
            Düzenle
          </Button>
          {fileUrl ? (
            <Button as="a" href={fileUrl} target="_blank" rel="noreferrer" icon={ExternalLink}>
              Yeni Sekmede Aç
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
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

          <div className="surface-card p-5">
            <div className="flex flex-wrap gap-2">
              <Badge value="info">{getCategoryName(resource.category)}</Badge>
              <Badge value="active">Yönetim</Badge>
            </div>

            <dl className="mt-5 grid gap-3">
              {[
                ['Yayıncı', resource.publisher || '-'],
                ['Konu', resource.subject || '-'],
                ['Sınıf', resource.gradeLevel || '-'],
                ['Soru Sayısı', resource.questionCount || '-'],
                ['Cevap Anahtarı', answerKeyText || 'Yok'],
                ['Oluşturma', formatDate(resource.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface-low p-3 dark:bg-dark-surface">
                  <dt className="text-xs font-bold uppercase text-outline dark:text-dark-muted">{label}</dt>
                  <dd className="mt-1 break-words font-semibold text-ink dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>

            {answerKey.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase text-outline dark:text-dark-muted">Soru Soru Cevaplar</h3>
                <div className="mt-3 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
                  {answerKey.map((answer, index) => (
                    <div
                      key={`${index + 1}-${answer}`}
                      className="rounded-lg border border-primary/15 bg-white p-2 text-center dark:border-primary-muted/20 dark:bg-dark-surface"
                    >
                      <p className="text-[11px] font-bold text-outline dark:text-dark-muted">{index + 1}</p>
                      <p className="text-base font-black text-primary dark:text-primary-muted">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="surface-card flex min-h-[70dvh] flex-col overflow-hidden">
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-surface-border px-4 py-3 dark:border-dark-border sm:px-5">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-ink dark:text-white">Test Önizleme</h2>
              <p className="truncate text-sm text-muted dark:text-dark-muted">{fileUrl || 'Dosya bağlantısı eklenmemiş'}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted">
              <ClipboardList className="h-5 w-5" />
            </span>
          </div>

          {previewUrl ? (
            <iframe title={`${resource.title} önizleme`} src={previewUrl} className="min-h-0 flex-1 border-0 bg-surface-low dark:bg-dark-surface" />
          ) : (
            <div className="grid flex-1 place-items-center p-8">
              <EmptyState title="Önizleme yok" description="Bu test için PDF veya harici bağlantı eklenmemiş." />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
