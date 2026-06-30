import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileCheck2, Search, Trophy } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getProgressForStudent, isSolvedProgressItem, progressItemKey } from '../../services/progressService';
import { categories, getCategoryName } from '../../utils/categories';
import { formatDate } from '../../utils/formatDate';

function sortDateValue(item) {
  const value = item.completedAt || item.updatedAt || item.createdAt;
  return value?.toMillis?.() || value?.seconds || new Date(value || 0).getTime() || 0;
}

function uniqueSolvedItems(items) {
  const map = new Map();

  items.filter(isSolvedProgressItem).forEach((item) => {
    const key = progressItemKey(item);
    const current = map.get(key);
    const itemPriority = item.legacyType === 'submission' ? 2 : 1;
    const currentPriority = current?.legacyType === 'submission' ? 2 : 1;

    if (!current || itemPriority > currentPriority || sortDateValue(item) > sortDateValue(current)) {
      map.set(key, item);
    }
  });

  return [...map.values()].sort((a, b) => sortDateValue(b) - sortDateValue(a));
}

function QuestionList({ label, numbers = [], tone }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase text-outline dark:text-dark-muted">{label}</p>
      {numbers.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {numbers.slice(0, 18).map((number) => (
            <span key={number} className={`rounded-lg px-2 py-1 text-xs font-extrabold ${tone}`}>
              {number}
            </span>
          ))}
          {numbers.length > 18 ? (
            <span className="rounded-lg bg-surface-low px-2 py-1 text-xs font-extrabold text-outline dark:bg-dark-surface dark:text-dark-muted">
              +{numbers.length - 18}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold text-muted dark:text-dark-muted">Yok</p>
      )}
    </div>
  );
}

export default function SolvedTests() {
  const { currentUser } = useAuth();
  const [progressItems, setProgressItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    async function loadSolvedTests() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        setProgressItems(await getProgressForStudent(currentUser.uid));
      } finally {
        setLoading(false);
      }
    }

    loadSolvedTests();
  }, [currentUser?.uid]);

  const solvedItems = useMemo(() => uniqueSolvedItems(progressItems), [progressItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('tr-TR');

    return solvedItems.filter((item) => {
      const searchMatch = normalizedSearch
        ? [item.resourceTitle, item.sourceCollection, getCategoryName(item.category)]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase('tr-TR').includes(normalizedSearch))
        : true;
      const categoryMatch = category ? item.category === category : true;
      return searchMatch && categoryMatch;
    });
  }, [category, search, solvedItems]);

  const scoredItems = solvedItems.filter((item) => typeof item.score === 'number');
  const averageScore =
    scoredItems.length > 0
      ? Math.round(scoredItems.reduce((total, item) => total + item.score, 0) / scoredItems.length)
      : null;

  if (loading) return <LoadingSpinner label="Çözülen testler yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-primary-soft to-secondary-soft p-6 dark:from-primary/15 dark:to-blue-500/10">
        <p className="text-sm font-bold text-primary dark:text-primary-muted">Çalışma Geçmişi</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">Çözülen Testler</h1>
        <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
          Kaydettiğin testleri, puanlarını ve soru bazlı sonuçlarını buradan takip edebilirsin.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/75 p-4 dark:bg-dark-card/70">
            <p className="text-sm font-semibold text-outline dark:text-dark-muted">Çözülen Test</p>
            <p className="mt-1 text-2xl font-extrabold text-ink dark:text-white">{solvedItems.length}</p>
          </div>
          <div className="rounded-xl bg-white/75 p-4 dark:bg-dark-card/70">
            <p className="text-sm font-semibold text-outline dark:text-dark-muted">Puanlanan Test</p>
            <p className="mt-1 text-2xl font-extrabold text-primary dark:text-primary-muted">{scoredItems.length}</p>
          </div>
          <div className="rounded-xl bg-white/75 p-4 dark:bg-dark-card/70">
            <p className="text-sm font-semibold text-outline dark:text-dark-muted">Ortalama Puan</p>
            <p className="mt-1 text-2xl font-extrabold text-tertiary dark:text-emerald-200">
              {averageScore === null ? '-' : `%${averageScore}`}
            </p>
          </div>
        </div>
      </section>

      <div className="animated-filter surface-card grid gap-3 p-4 md:grid-cols-[1.5fr_1fr]">
        <Input
          icon={Search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Test, yayıncı veya kategori ara..."
        />
        <Input as="select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kategori">
          <option value="">Tüm Kategoriler</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Input>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Çözülen test bulunamadı"
          description="Test çözüp cevaplarını kaydettiğinde sonuçların burada görünecek."
        />
      ) : (
        <div className="stagger-grid grid gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const scoring = item.scoring || {};
            return (
              <article key={`${item.legacyType}-${item.id}`} className="surface-card p-5 hover:-translate-y-0.5 hover:shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tertiary-soft text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <Badge value="completed">Tamamlandı</Badge>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase text-outline dark:text-dark-muted">
                    {getCategoryName(item.category)} · {item.sourceCollection || 'Yayıncı'}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-xl font-extrabold text-ink dark:text-white">
                    {item.resourceTitle || 'İsimsiz test'}
                  </h2>
                  <p className="mt-1 text-sm text-muted dark:text-dark-muted">Çözülme: {formatDate(item.completedAt || item.updatedAt)}</p>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-primary-soft p-3 text-primary dark:bg-primary/15 dark:text-primary-muted">
                    <p className="text-lg font-black">{typeof item.score === 'number' ? `%${item.score}` : '-'}</p>
                    <p className="text-[11px] font-bold">Puan</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-tertiary dark:bg-emerald-500/10 dark:text-emerald-200">
                    <p className="text-lg font-black">{scoring.correctCount ?? '-'}</p>
                    <p className="text-[11px] font-bold">Doğru</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3 text-danger dark:bg-red-500/10 dark:text-red-200">
                    <p className="text-lg font-black">{scoring.wrongCount ?? '-'}</p>
                    <p className="text-[11px] font-bold">Yanlış</p>
                  </div>
                  <div className="rounded-xl bg-surface-low p-3 text-outline dark:bg-dark-surface dark:text-dark-muted">
                    <p className="text-lg font-black">{scoring.blankCount ?? '-'}</p>
                    <p className="text-[11px] font-bold">Boş</p>
                  </div>
                </div>

                {item.scoring ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <QuestionList
                      label="Doğru"
                      numbers={scoring.correctQuestions || []}
                      tone="bg-emerald-100 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200"
                    />
                    <QuestionList
                      label="Yanlış"
                      numbers={scoring.wrongQuestions || []}
                      tone="bg-red-100 text-danger dark:bg-red-500/15 dark:text-red-200"
                    />
                    <QuestionList
                      label="Boş"
                      numbers={scoring.blankQuestions || []}
                      tone="bg-slate-200 text-outline dark:bg-white/10 dark:text-dark-muted"
                    />
                  </div>
                ) : (
                  <p className="mt-5 rounded-xl bg-surface-low p-3 text-sm font-semibold text-muted dark:bg-dark-surface dark:text-dark-muted">
                    Bu testte cevap anahtarı olmadığı için soru bazlı değerlendirme bulunmuyor.
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  {item.resourceId ? (
                    <Button as={Link} to={`/resource/${item.resourceId}/solve`} size="sm" icon={CheckCircle2} className="flex-1">
                      Sonucu Aç
                    </Button>
                  ) : null}
                  {item.resourceId ? (
                    <Button as={Link} to={`/resource/${item.resourceId}`} variant="outline" size="sm" className="flex-1">
                      Test Detayı
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
