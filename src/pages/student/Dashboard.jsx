import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Megaphone,
  SquarePen,
  Target,
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AssignmentCard from '../../components/resources/AssignmentCard';
import { useAuth } from '../../contexts/AuthContext';
import { getAnnouncements } from '../../services/announcementService';
import { getResources } from '../../services/resourceService';
import { getProgressForStudent, getProgressSummary } from '../../services/progressService';
import { categories, categoryTone } from '../../utils/categories';

const icons = {
  denemeler: ClipboardList,
  'haftalik-denemeler': CalendarDays,
  yayinlar: BookOpen,
  testler: SquarePen,
  'yazili-ornekleri': FileText,
};

function itemDateValue(item) {
  const value = item.completedAt || item.updatedAt || item.createdAt;
  return value?.toMillis?.() || value?.seconds || new Date(value || 0).getTime() || 0;
}

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const [resourceItems, progressItems, progressSummary, announcementItems] = await Promise.all([
          getResources({ onlyActive: true, sortBy: 'newest' }),
          getProgressForStudent(currentUser.uid),
          getProgressSummary(currentUser.uid),
          getAnnouncements({ activeOnly: true }),
        ]);
        setResources(resourceItems);
        setProgress(progressItems);
        setSummary(progressSummary);
        setAnnouncements(announcementItems);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [currentUser?.uid]);

  const resourceCounts = useMemo(
    () =>
      resources.reduce((acc, resource) => {
        acc[resource.category] = (acc[resource.category] || 0) + 1;
        return acc;
      }, {}),
    [resources],
  );

  const assignments = progress.filter((item) => item.legacyType === 'assignment');
  const pendingAssignmentItems = assignments.filter((item) => item.status !== 'completed');
  const latestAssignments = pendingAssignmentItems.slice(0, 3);
  const mainAnnouncement = announcements[0];
  const solvedItems = progress.filter((item) => item.status === 'completed' || item.scoring || item.answeredCount);
  const solvedResourceCount = summary?.completed || new Set(solvedItems.map((item) => item.resourceId || item.id)).size;
  const pendingAssignments = pendingAssignmentItems.length;
  const scoredItems = solvedItems.filter((item) => typeof item.score === 'number');
  const averageScore = scoredItems.length
    ? Math.round(scoredItems.reduce((total, item) => total + item.score, 0) / scoredItems.length)
    : null;
  const latestSolved = [...solvedItems].sort((a, b) => itemDateValue(b) - itemDateValue(a))[0];
  const solvedCategories = new Set(solvedItems.map((item) => item.category).filter(Boolean)).size;

  if (loading) {
    return <LoadingSpinner label="Panel yükleniyor" />;
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-primary dark:text-primary-muted">Öğrenci Paneli</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">
          Hoş geldin, {userProfile?.name?.split(' ')[0] || 'Öğrenci'}.
        </h1>
        <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
          Bugün çalışmak istediğin kaynak kategorisini seçebilir, son eklenen içerikleri inceleyebilir ve ilerlemeni takip edebilirsin.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => {
          const Icon = icons[category.id];
          const tone = categoryTone[category.color];
          return (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className={`group relative overflow-hidden rounded-2xl border p-5 shadow-card hover:-translate-y-1 hover:shadow-soft ${tone.card}`}
            >
              <div className={`mb-5 grid h-12 w-12 place-items-center rounded-xl ${tone.icon}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-extrabold">{category.name}</h2>
              <p className="mt-2 min-h-12 text-sm opacity-80">{category.description}</p>
              <p className="mt-4 text-sm font-bold">{resourceCounts[category.id] || 0} kaynak</p>
              <Icon className="absolute -bottom-5 -right-4 h-24 w-24 opacity-10 transition-transform group-hover:scale-110" />
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink dark:text-white">Atanan Ödevler</h2>
                <p className="text-sm text-muted dark:text-dark-muted">Sana atanmış son çalışmalar</p>
              </div>
              <Link to="/assignments" className="text-sm font-bold text-primary hover:underline dark:text-primary-muted">
                Tümünü Gör
              </Link>
            </div>
            {latestAssignments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {latestAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            ) : (
              <EmptyState title="Atanmış ödev yok" description="Yeni ödev atandığında burada görünecek." />
            )}
          </section>

        </div>

        <aside className="space-y-6">
          <div className="surface-card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-ink dark:text-white">Çalışma Özeti</h2>
                <p className="text-sm text-muted dark:text-dark-muted">Çözümlerin ve bekleyen ödevlerin</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-low p-3 dark:bg-dark-surface">
                <p className="text-xs font-bold text-outline dark:text-dark-muted">Çözülen Test</p>
                <p className="mt-1 text-2xl font-extrabold text-ink dark:text-white">{solvedResourceCount}</p>
              </div>
              <div className="rounded-xl bg-surface-low p-3 dark:bg-dark-surface">
                <p className="text-xs font-bold text-outline dark:text-dark-muted">Ortalama</p>
                <p className="mt-1 text-2xl font-extrabold text-primary dark:text-primary-muted">
                  {averageScore === null ? '-' : `%${averageScore}`}
                </p>
              </div>
              <div className="rounded-xl bg-surface-low p-3 dark:bg-dark-surface">
                <p className="text-xs font-bold text-outline dark:text-dark-muted">Bekleyen Ödev</p>
                <p className="mt-1 text-2xl font-extrabold text-amber dark:text-orange-200">{pendingAssignments}</p>
              </div>
              <div className="rounded-xl bg-surface-low p-3 dark:bg-dark-surface">
                <p className="text-xs font-bold text-outline dark:text-dark-muted">Kategori</p>
                <p className="mt-1 text-2xl font-extrabold text-tertiary dark:text-emerald-200">{solvedCategories}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-surface-border bg-white p-3 dark:border-dark-border dark:bg-dark-card">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tertiary dark:text-emerald-200" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-outline dark:text-dark-muted">Son Çözüm</p>
                  <p className="mt-1 truncate text-sm font-extrabold text-ink dark:text-white">
                    {latestSolved?.resourceTitle || 'Henüz test çözülmedi'}
                  </p>
                  {latestSolved?.score !== null && latestSolved?.score !== undefined ? (
                    <p className="mt-1 text-xs font-semibold text-muted dark:text-dark-muted">Puan: %{latestSolved.score}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-soft text-amber dark:bg-orange-500/15 dark:text-orange-200">
                <Megaphone className="h-5 w-5" />
              </span>
              <h2 className="font-extrabold text-ink dark:text-white">Duyuru</h2>
            </div>
            {mainAnnouncement ? (
              <div>
                <h3 className="font-bold text-ink dark:text-white">{mainAnnouncement.title}</h3>
                <p className="mt-2 text-sm text-muted dark:text-dark-muted">{mainAnnouncement.content}</p>
              </div>
            ) : (
              <p className="text-sm text-muted dark:text-dark-muted">Aktif duyuru bulunmuyor.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
