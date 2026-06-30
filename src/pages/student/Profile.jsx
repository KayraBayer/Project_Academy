import { useEffect, useState } from 'react';
import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StudentStatsCard from '../../components/admin/StudentStatsCard';
import { useAuth } from '../../contexts/AuthContext';
import { getProgressSummary } from '../../services/progressService';
import { formatDateTime } from '../../utils/formatDate';
import { categories } from '../../utils/categories';

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        setSummary(await getProgressSummary(currentUser.uid));
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [currentUser?.uid]);

  if (loading) return <LoadingSpinner label="Profil yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {userProfile?.profilePhotoURL ? (
            <img src={userProfile.profilePhotoURL} alt={userProfile.name} className="h-24 w-24 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-primary-soft text-4xl font-extrabold text-primary dark:bg-primary/15 dark:text-primary-muted">
              {(userProfile?.name || 'Ö').slice(0, 1).toLocaleUpperCase('tr-TR')}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold text-ink dark:text-white">{userProfile?.name || 'Öğrenci'}</h1>
              <Badge value={userProfile?.status || 'active'} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted dark:text-dark-muted sm:grid-cols-2">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {userProfile?.email || currentUser?.email}
              </span>
              <span className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {userProfile?.gradeLevel || 'Sınıf bilgisi yok'}
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Son giriş: {formatDateTime(userProfile?.lastLoginAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Toplam İlerleme</p>
          <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{summary?.total || 0}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Tamamlanan Kaynak</p>
          <p className="mt-2 text-3xl font-extrabold text-tertiary dark:text-emerald-200">{summary?.completed || 0}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Ortalama Puan</p>
          <p className="mt-2 text-3xl font-extrabold text-primary dark:text-primary-muted">
            {summary?.averageScore ?? '-'}
          </p>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-xl font-extrabold text-ink dark:text-white">Kategori Bazlı İlerleme</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <StudentStatsCard
              key={category.id}
              categoryId={category.id}
              total={summary?.byCategory?.[category.id]?.total || 0}
              completed={summary?.byCategory?.[category.id]?.completed || 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
