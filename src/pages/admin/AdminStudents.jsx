import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, UsersRound } from 'lucide-react';
import AdminTable from '../../components/admin/AdminTable';
import StatCard from '../../components/admin/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getProgressForStudent, isSolvedProgressItem, progressItemKey } from '../../services/progressService';
import { getStudents } from '../../services/userService';
import { formatDate } from '../../utils/formatDate';

function buildStudentStats(progressItems) {
  return progressItems.reduce((acc, item) => {
    const current = acc[item.studentId] || { completedKeys: new Set(), scores: [], total: 0 };
    current.total += 1;
    if (isSolvedProgressItem(item)) current.completedKeys.add(progressItemKey(item));
    if (typeof item.score === 'number') current.scores.push(item.score);
    acc[item.studentId] = current;
    return acc;
  }, {});
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      try {
        const studentItems = await getStudents();
        const studentProgress = await Promise.all(
          studentItems.map((student) => getProgressForStudent(student.uid || student.id)),
        );
        const progressItems = studentProgress.flat();
        setStudents(studentItems);
        setProgress(progressItems);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const stats = useMemo(() => buildStudentStats(progress), [progress]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchMatch = search
        ? [student.name, student.email]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
        : true;
      const statusMatch = status ? student.status === status : true;
      return searchMatch && statusMatch;
    });
  }, [search, status, students]);

  const averageScore = useMemo(() => {
    const allScores = progress.filter((item) => typeof item.score === 'number').map((item) => item.score);
    if (allScores.length === 0) return '-';
    return Math.round(allScores.reduce((total, score) => total + score, 0) / allScores.length);
  }, [progress]);

  if (loading) return <LoadingSpinner label="Öğrenciler yükleniyor" />;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-extrabold text-ink dark:text-white">Öğrenci İstatistikleri</h1>
        <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
          Öğrencilerin ilerleme, tamamlanma ve puan durumlarını inceleyin.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Öğrenci" value={students.length} icon={UsersRound} tone="primary" trend="+12%" />
        <StatCard
          title="Tamamlanan Kaynak"
          value={new Set(progress.filter(isSolvedProgressItem).map(progressItemKey)).size}
          icon={UsersRound}
          tone="tertiary"
        />
        <StatCard title="Ortalama Puan" value={averageScore} icon={UsersRound} tone="secondary" />
        <StatCard title="Aktif Hesap" value={students.filter((item) => item.status === 'active').length} icon={UsersRound} tone="amber" />
      </section>

      <div className="animated-filter surface-card grid gap-3 p-4 md:grid-cols-[1.5fr_1fr]">
        <Input icon={Search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="İsim veya e-posta ara..." />
        <Input as="select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="suspended">Askıda</option>
        </Input>
      </div>

      <AdminTable
        emptyTitle="Öğrenci bulunamadı"
        columns={[
          {
            key: 'name',
            label: 'Öğrenci',
            render: (row) => (
              <div>
                <p className="font-bold text-ink dark:text-white">{row.name || 'İsimsiz Öğrenci'}</p>
                <p className="text-xs text-outline dark:text-dark-muted">{row.email}</p>
              </div>
            ),
          },
          { key: 'gradeLevel', label: 'Sınıf', render: (row) => row.gradeLevel || '-' },
          {
            key: 'completed',
            label: 'Tamamlanan',
            render: (row) => stats[row.uid || row.id]?.completedKeys?.size || 0,
          },
          {
            key: 'averageScore',
            label: 'Ortalama Puan',
            render: (row) => {
              const scores = stats[row.uid || row.id]?.scores || [];
              return scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : '-';
            },
          },
          { key: 'status', label: 'Durum', render: (row) => <Badge value={row.status} /> },
          { key: 'lastLoginAt', label: 'Son Giriş', render: (row) => formatDate(row.lastLoginAt) },
          {
            key: 'actions',
            label: 'İşlemler',
            render: (row) => (
              <Button as={Link} to={`/admin/students/${row.uid || row.id}`} variant="ghost" size="sm" icon={Eye}>
                Detay
              </Button>
            ),
          },
        ]}
        rows={filteredStudents}
      />
    </div>
  );
}
