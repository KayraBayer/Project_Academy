import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Search } from 'lucide-react';
import AssignmentCard from '../../components/resources/AssignmentCard';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getAssignmentsForStudent } from '../../services/progressService';

export default function Assignments() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadAssignments() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        setAssignments(await getAssignmentsForStudent(currentUser.uid));
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, [currentUser?.uid]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (assignment.status === 'completed') return false;
      const searchMatch = search
        ? [assignment.resourceTitle, assignment.sourceCollection]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
        : true;
      return searchMatch;
    });
  }, [assignments, search]);

  const completedCount = assignments.filter((assignment) => assignment.status === 'completed').length;
  const pendingCount = assignments.length - completedCount;

  if (loading) return <LoadingSpinner label="Atanan ödevler yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-amber-soft to-primary-soft p-6 dark:from-orange-500/15 dark:to-primary/10">
        <p className="text-sm font-bold text-amber dark:text-orange-200">Öğrenci</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">Atanan Ödevler</h1>
        <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
          Sana atanmış test ve çalışma ödevlerini buradan takip edebilirsin.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/75 p-4 dark:bg-dark-card/70">
            <p className="text-sm font-semibold text-outline dark:text-dark-muted">Toplam Ödev</p>
            <p className="mt-1 text-2xl font-extrabold text-ink dark:text-white">{assignments.length}</p>
          </div>
          <div className="rounded-xl bg-white/75 p-4 dark:bg-dark-card/70">
            <p className="text-sm font-semibold text-outline dark:text-dark-muted">Tamamlanan</p>
            <p className="mt-1 text-2xl font-extrabold text-tertiary dark:text-emerald-200">{completedCount}</p>
          </div>
          <div className="rounded-xl bg-white/75 p-4 dark:bg-dark-card/70">
            <p className="text-sm font-semibold text-outline dark:text-dark-muted">Bekleyen</p>
            <p className="mt-1 text-2xl font-extrabold text-amber dark:text-orange-200">{pendingCount}</p>
          </div>
        </div>
      </section>

      <div className="animated-filter surface-card p-4">
        <Input
          icon={Search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Bekleyen ödev adı veya kategori ara..."
        />
      </div>

      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Bekleyen ödev bulunamadı"
          description="Tamamlanmamış ödevin yok veya arama ile eşleşen bekleyen ödev bulunamadı."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
