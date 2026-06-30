import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight, Layers3, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ResourceTable from '../../components/resources/ResourceTable';
import { deleteResource, getResources } from '../../services/resourceService';
import { categories, categoryMap, categoryTone } from '../../utils/categories';

function sortDateValue(value) {
  return value?.toMillis?.() || value?.seconds || 0;
}

function getGradeSortValue(resource) {
  const grade = resource.grade || Number(String(resource.gradeLevel || '').match(/\d+/)?.[0]);
  return Number.isFinite(grade) && grade > 0 ? grade : 99;
}

export default function AdminResources({ forcedCategory = '', selectedPublisher = '' }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadResources() {
    setLoading(true);
    try {
      setResources(await getResources({ sortBy: 'newest' }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearch('');
    setSubject('');
    setGradeLevel('');
    setSortBy('newest');
  }, [forcedCategory, selectedPublisher]);

  useEffect(() => {
    loadResources();
  }, []);

  const categorySummaries = useMemo(() => {
    const searchValue = search.toLocaleLowerCase('tr-TR');
    return categories
      .map((category) => {
        const categoryResources = resources.filter((resource) => resource.category === category.id);
        return {
          ...category,
          resourceCount: categoryResources.length,
          publisherCount: new Set(categoryResources.map((resource) => resource.publisher).filter(Boolean)).size,
        };
      })
      .filter((category) => (searchValue ? category.name.toLocaleLowerCase('tr-TR').includes(searchValue) : true));
  }, [resources, search]);

  const categoryResources = useMemo(() => {
    return forcedCategory ? resources.filter((resource) => resource.category === forcedCategory) : [];
  }, [forcedCategory, resources]);

  const publisherSummaries = useMemo(() => {
    const grouped = categoryResources.reduce((acc, resource) => {
      const name = resource.publisher || resource.sourceCollection || 'Yayıncı belirtilmedi';
      const current = acc[name] || {
        name,
        count: 0,
        grades: new Set(),
        subjects: new Set(),
        latestAt: 0,
      };
      current.count += 1;
      if (resource.gradeLevel) current.grades.add(resource.gradeLevel);
      if (resource.subject) current.subjects.add(resource.subject);
      current.latestAt = Math.max(current.latestAt, sortDateValue(resource.createdAt));
      acc[name] = current;
      return acc;
    }, {});

    const searchValue = search.toLocaleLowerCase('tr-TR');
    return Object.values(grouped)
      .map((publisher) => ({
        ...publisher,
        grades: [...publisher.grades],
        subjects: [...publisher.subjects],
      }))
      .filter((publisher) => (searchValue ? publisher.name.toLocaleLowerCase('tr-TR').includes(searchValue) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [categoryResources, search]);

  const selectedPublisherResources = useMemo(() => {
    if (!forcedCategory || !selectedPublisher) return [];
    return categoryResources.filter((resource) => resource.publisher === selectedPublisher);
  }, [categoryResources, forcedCategory, selectedPublisher]);

  const tableFacets = useMemo(() => {
    const subjects = [...new Set(selectedPublisherResources.map((resource) => resource.subject).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'tr'),
    );
    const gradeLevels = [...new Set(selectedPublisherResources.map((resource) => resource.gradeLevel).filter(Boolean))].sort(
      (a, b) => {
        const gradeA = Number(String(a).match(/\d+/)?.[0]) || 99;
        const gradeB = Number(String(b).match(/\d+/)?.[0]) || 99;
        return gradeA - gradeB || a.localeCompare(b, 'tr');
      },
    );

    return { subjects, gradeLevels };
  }, [selectedPublisherResources]);

  const tableResources = useMemo(() => {
    const searchValue = search.toLocaleLowerCase('tr-TR');
    const filteredItems = selectedPublisherResources
      .filter((resource) => (subject ? resource.subject === subject : true))
      .filter((resource) => (gradeLevel ? resource.gradeLevel === gradeLevel : true))
      .filter((resource) =>
        searchValue
          ? [resource.title, resource.subject, resource.gradeLevel, resource.testId, resource.uniqueId]
              .filter(Boolean)
              .some((value) => value.toLocaleLowerCase('tr-TR').includes(searchValue))
          : true,
      );

    if (sortBy === 'grade') {
      return [...filteredItems].sort((a, b) => {
        const gradeDiff = getGradeSortValue(a) - getGradeSortValue(b);
        return gradeDiff || (a.title || '').localeCompare(b.title || '', 'tr');
      });
    }
    if (sortBy === 'questions') return [...filteredItems].sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0));
    if (sortBy === 'title') return [...filteredItems].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr'));
    return [...filteredItems].sort((a, b) => sortDateValue(b.createdAt) - sortDateValue(a.createdAt));
  }, [gradeLevel, search, selectedPublisherResources, sortBy, subject]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResource(deleteTarget);
      toast.success('Test silindi.');
      setDeleteTarget(null);
      await loadResources();
    } catch (error) {
      toast.error(error.message || 'Test silinemedi.');
    } finally {
      setDeleting(false);
    }
  }

  const category = forcedCategory ? categoryMap[forcedCategory] : null;
  const isCategoryStep = Boolean(forcedCategory && !selectedPublisher);
  const isPublisherStep = Boolean(forcedCategory && selectedPublisher);
  const pageTitle = isPublisherStep
    ? selectedPublisher
    : isCategoryStep
      ? `${category?.name || 'Kategori'} Yayıncıları`
      : 'Kaynak Yönetimi';
  const searchPlaceholder = isPublisherStep
    ? 'Test adı, konu veya ID ara...'
    : isCategoryStep
      ? 'Yayıncı ara...'
      : 'Kategori ara...';

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink dark:text-white">{pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            Önce kategori, sonra yayıncı seçin; test tablosu yalnızca seçilen yayıncı için açılır.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isPublisherStep ? (
            <Button as={Link} to={`/admin/resources/${forcedCategory}`} variant="outline" icon={ArrowLeft}>
              Yayıncılara Dön
            </Button>
          ) : isCategoryStep ? (
            <Button as={Link} to="/admin/resources" variant="outline" icon={ArrowLeft}>
              Kategorilere Dön
            </Button>
          ) : null}
          <Button as={Link} to="/admin/resources/new" icon={Plus}>
            Yeni Test
          </Button>
        </div>
      </section>

      <div
        className={`animated-filter surface-card grid gap-3 p-4 ${
          isPublisherStep ? 'md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]' : ''
        }`}
      >
        <Input icon={Search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
        {isPublisherStep ? (
          <>
            <Input as="select" value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Konu filtresi">
              <option value="">Tüm Konular</option>
              {tableFacets.subjects.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Input>
            <Input as="select" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} aria-label="Sınıf filtresi">
              <option value="">Tüm Sınıflar</option>
              {tableFacets.gradeLevels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Input>
            <Input as="select" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sıralama">
              <option value="newest">En Yeni</option>
              <option value="grade">Sınıfa Göre</option>
              <option value="questions">Soru Sayısına Göre</option>
              <option value="title">Başlığa Göre</option>
            </Input>
          </>
        ) : null}
      </div>

      {loading ? (
        <LoadingSpinner label="Kaynaklar yükleniyor" />
      ) : !forcedCategory ? (
        <div className="stagger-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {categorySummaries.map((item) => {
            const tone = categoryTone[item.color];
            return (
              <Link
                key={item.id}
                to={`/admin/resources/${item.id}`}
                className={`group relative overflow-hidden rounded-2xl border p-5 shadow-card hover:-translate-y-1 hover:shadow-soft ${tone.card}`}
              >
                <div className={`mb-5 grid h-12 w-12 place-items-center rounded-xl ${tone.icon}`}>
                  <Layers3 className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-extrabold">{item.name}</h2>
                <p className="mt-2 min-h-12 text-sm opacity-80">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span>{item.publisherCount} yayıncı</span>
                  <span>{item.resourceCount} test</span>
                </div>
                <ChevronRight className="absolute bottom-5 right-5 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      ) : isCategoryStep ? (
        publisherSummaries.length === 0 ? (
          <EmptyState icon={Building2} title="Yayıncı bulunamadı" description="Bu kategoride eşleşen yayıncı yok." />
        ) : (
          <div className="stagger-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publisherSummaries.map((publisher) => (
              <Link
                key={publisher.name}
                to={`/admin/resources/${forcedCategory}/publisher/${encodeURIComponent(publisher.name)}`}
                className="surface-card group flex h-full flex-col p-5 hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-surface-low px-3 py-1 text-xs font-bold text-muted dark:bg-dark-surface dark:text-dark-muted">
                    {publisher.count} test
                  </span>
                </div>
                <h2 className="line-clamp-2 text-lg font-extrabold text-ink group-hover:text-primary dark:text-white">
                  {publisher.name}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted dark:text-dark-muted">
                  <span className="rounded-full bg-surface-low px-2.5 py-1 dark:bg-dark-surface">
                    {publisher.grades.slice(0, 2).join(', ') || 'Sınıf yok'}
                  </span>
                  <span className="rounded-full bg-surface-low px-2.5 py-1 dark:bg-dark-surface">
                    {publisher.subjects.length || 0} konu
                  </span>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary dark:text-primary-muted">
                  Testleri Aç <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )
      ) : tableResources.length === 0 ? (
        <EmptyState title="Test bulunamadı" description="Bu yayıncıda seçili filtrelerle eşleşen test yok." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted dark:text-dark-muted">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary dark:bg-primary/15 dark:text-primary-muted">
              {tableResources.length} test
            </span>
            {gradeLevel ? <span className="rounded-full bg-surface-low px-3 py-1 dark:bg-dark-surface">{gradeLevel}</span> : null}
            {subject ? <span className="rounded-full bg-surface-low px-3 py-1 dark:bg-dark-surface">{subject}</span> : null}
          </div>
          <ResourceTable resources={tableResources} onDelete={setDeleteTarget} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Testi sil"
        description={`${deleteTarget?.title || 'Bu test'} kalıcı olarak silinecek.`}
        confirmLabel="Evet, Sil"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
