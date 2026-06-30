import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, ChevronRight, Layers3, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import ResourceCard from '../../components/resources/ResourceCard';
import ResourceFilters from '../../components/resources/ResourceFilters';
import { useAuth } from '../../contexts/AuthContext';
import { getProgressForStudent } from '../../services/progressService';
import { getResources } from '../../services/resourceService';
import { categoryMap, categoryTone } from '../../utils/categories';

function getGradeSortValue(resource) {
  const grade = resource.grade || Number(String(resource.gradeLevel || '').match(/\d+/)?.[0]);
  return Number.isFinite(grade) && grade > 0 ? grade : 99;
}

export default function CategoryPage() {
  const { category: categoryId, publisher: publisherParam } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const category = categoryMap[categoryId];
  const selectedPublisher = publisherParam || '';
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [resources, setResources] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    async function loadCategory() {
      if (!category || !currentUser?.uid) return;
      setLoading(true);
      setError('');
      try {
        const [resourceItems, progressItems] = await Promise.all([
          getResources({ category: category.id, sortBy: 'newest' }),
          getProgressForStudent(currentUser.uid),
        ]);
        setResources(resourceItems);
        setProgress(progressItems);
      } catch (loadError) {
        console.error(loadError);
        setError('Kaynaklar yüklenirken bir sorun oluştu.');
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [category, currentUser?.uid]);

  const publisherSummaries = useMemo(() => {
    const grouped = resources.reduce((acc, resource) => {
      const name = resource.publisher || resource.sourceCollection || 'Yayıncı belirtilmedi';
      const current = acc[name] || {
        name,
        count: 0,
        subjects: new Set(),
        grades: new Set(),
      };
      current.count += 1;
      if (resource.subject) current.subjects.add(resource.subject);
      if (resource.gradeLevel) current.grades.add(resource.gradeLevel);
      acc[name] = current;
      return acc;
    }, {});

    const publisherSearch = search.toLocaleLowerCase('tr-TR');
    return Object.values(grouped)
      .map((item) => ({
        ...item,
        subjects: [...item.subjects],
        grades: [...item.grades],
      }))
      .filter((item) => (publisherSearch ? item.name.toLocaleLowerCase('tr-TR').includes(publisherSearch) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [resources, search]);

  const publisherResources = useMemo(() => {
    let items = selectedPublisher ? resources.filter((resource) => resource.publisher === selectedPublisher) : [];

    if (subject) items = items.filter((resource) => resource.subject === subject);
    if (gradeLevel) items = items.filter((resource) => resource.gradeLevel === gradeLevel);
    if (search) {
      const normalizedSearch = search.toLocaleLowerCase('tr-TR');
      items = items.filter((resource) =>
        [resource.title, resource.publisher, resource.subject, resource.description]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase('tr-TR').includes(normalizedSearch)),
      );
    }

    if (sortBy === 'popular') return [...items].sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0));
    if (sortBy === 'grade') {
      return [...items].sort((a, b) => {
        const gradeDiff = getGradeSortValue(a) - getGradeSortValue(b);
        return gradeDiff || (a.title || '').localeCompare(b.title || '', 'tr');
      });
    }
    if (sortBy === 'title') return [...items].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr'));
    return items;
  }, [gradeLevel, resources, search, selectedPublisher, sortBy, subject]);

  const progressMap = useMemo(
    () =>
      progress.reduce((acc, item) => {
        if (item.resourceId) acc[item.resourceId] = item;
        if (item.sourceCollection && item.resourceTitle) acc[`${item.sourceCollection}::${item.resourceTitle}`] = item;
        return acc;
      }, {}),
    [progress],
  );

  const facets = useMemo(() => {
    const baseResources = selectedPublisher ? resources.filter((item) => item.publisher === selectedPublisher) : resources;
    const subjects = [...new Set(baseResources.map((item) => item.subject).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'tr'),
    );
    const gradeLevels = [...new Set(baseResources.map((item) => item.gradeLevel).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'tr'),
    );
    return { subjects, gradeLevels };
  }, [resources, selectedPublisher]);

  if (!category) {
    return <EmptyState icon={AlertCircle} title="Kategori bulunamadı" description="Aradığınız kategori mevcut değil." />;
  }

  const tone = categoryTone[category.color];

  return (
    <div className="space-y-6">
      <section className={`animate-rise rounded-2xl bg-gradient-to-br p-6 ${tone.accent}`}>
        <p className="text-sm font-bold text-primary dark:text-primary-muted">Kategori</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{category.name}</h1>
        <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">{category.description}</p>
      </section>

      {loading ? (
        <div className="stagger-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="surface-card h-80 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Bir sorun oluştu" description={error} />
      ) : !selectedPublisher ? (
        <>
          <div className="animated-filter surface-card p-4">
            <Input
              icon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Yayıncı ara..."
              aria-label="Yayıncı ara"
            />
          </div>

          {publisherSummaries.length === 0 ? (
            <EmptyState icon={Building2} title="Yayıncı bulunamadı" description="Bu kategoride eşleşen yayıncı yok." />
          ) : (
            <div className="stagger-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publisherSummaries.map((publisher) => (
                <Link
                  key={publisher.name}
                  to={`/category/${category.id}/publisher/${encodeURIComponent(publisher.name)}`}
                  className="surface-card group flex h-full flex-col p-5 hover:-translate-y-1 hover:shadow-soft"
                  onClick={() => {
                    setSearch('');
                    setSubject('');
                    setGradeLevel('');
                    setSortBy('newest');
                  }}
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/80 text-primary shadow-sm dark:bg-dark-surface dark:text-primary-muted">
                      <Building2 className="h-6 w-6" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary dark:bg-primary/15 dark:text-primary-muted">
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
                    Testleri Gör <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : publisherResources.length === 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-muted dark:text-dark-muted">
              <Layers3 className="h-4 w-4 text-primary" />
              {selectedPublisher}
            </div>
            <Button as={Link} to={`/category/${category.id}`} variant="outline" icon={ArrowLeft}>
              Yayıncılara Dön
            </Button>
          </div>
          <ResourceFilters
            search={search}
            onSearch={setSearch}
            subject={subject}
            onSubject={setSubject}
            subjects={facets.subjects}
            gradeLevel={gradeLevel}
            onGradeLevel={setGradeLevel}
            gradeLevels={facets.gradeLevels}
            sortBy={sortBy}
            onSortBy={setSortBy}
          />
          <EmptyState title="Test bulunamadı" description="Bu yayıncıda seçili filtrelerle eşleşen test yok." />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-muted dark:text-dark-muted">
              <Layers3 className="h-4 w-4 text-primary" />
              {selectedPublisher}
            </div>
            <Button as={Link} to={`/category/${category.id}`} variant="outline" icon={ArrowLeft}>
              Yayıncılara Dön
            </Button>
          </div>
          <ResourceFilters
            search={search}
            onSearch={setSearch}
            subject={subject}
            onSubject={setSubject}
            subjects={facets.subjects}
            gradeLevel={gradeLevel}
            onGradeLevel={setGradeLevel}
            gradeLevels={facets.gradeLevels}
            sortBy={sortBy}
            onSortBy={setSortBy}
          />
          <div className="stagger-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publisherResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                progress={progressMap[resource.id] || progressMap[`${resource.sourceCollection}::${resource.title}`]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
