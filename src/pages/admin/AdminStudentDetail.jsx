import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleSlash2, Mail, UserRound, XCircle } from 'lucide-react';
import AdminTable from '../../components/admin/AdminTable';
import StudentStatsCard from '../../components/admin/StudentStatsCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getProgressForStudent, isSolvedProgressItem, progressItemKey } from '../../services/progressService';
import { getResources } from '../../services/resourceService';
import { getStudents, getUserProfile } from '../../services/userService';
import { categories } from '../../utils/categories';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const answerOptions = ['A', 'B', 'C', 'D'];

function sortDateValue(item) {
  const value = item.completedAt || item.updatedAt || item.createdAt;
  return value?.toMillis?.() || value?.seconds || new Date(value || 0).getTime() || 0;
}

function normalizeAnswer(value) {
  const answer = String(value || '').toLocaleUpperCase('tr-TR');
  return answerOptions.includes(answer) ? answer : '';
}

function getAnswerArray(item) {
  const scoring = item.scoring || {};
  const count = Number(
    item.questionCount ||
      item.count ||
      scoring.keyLength ||
      scoring.compared ||
      item.answersArray?.length ||
      String(item.answers || '').length ||
      0,
  );

  const answers = Array.from({ length: count }, () => '');

  if (Array.isArray(item.answersArray)) {
    item.answersArray.forEach((answer, index) => {
      if (index < answers.length) answers[index] = normalizeAnswer(answer);
    });
  }

  if (item.answersMap && typeof item.answersMap === 'object') {
    Object.entries(item.answersMap).forEach(([question, answer]) => {
      const index = Number(question) - 1;
      if (index >= 0 && index < answers.length) answers[index] = normalizeAnswer(answer);
    });
  }

  if (typeof item.answers === 'string' && !answers.some(Boolean)) {
    item.answers.split('').forEach((answer, index) => {
      if (index < answers.length) answers[index] = normalizeAnswer(answer);
    });
  }

  return answers;
}

function uniqueSolvedProgress(items) {
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

function NumberList({ title, numbers = [], icon: Icon, tone }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-2.5 dark:border-dark-border dark:bg-dark-card">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone.icon}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-extrabold text-ink dark:text-white">{title}</p>
      </div>
      {numbers.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {numbers.map((number) => (
            <span key={number} className={`rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${tone.badge}`}>
              {number}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs font-semibold text-muted dark:text-dark-muted">Yok</p>
      )}
    </div>
  );
}

function AnswerGrid({ item }) {
  const answers = getAnswerArray(item);
  const answerKey = String(item.scoring?.answerKey || '').split('');
  const correctSet = new Set(item.scoring?.correctQuestions || []);
  const wrongSet = new Set(item.scoring?.wrongQuestions || []);
  const blankSet = new Set(item.scoring?.blankQuestions || []);

  if (answers.length === 0) {
    return (
      <p className="rounded-xl bg-surface-low p-3 text-sm font-semibold text-muted dark:bg-dark-surface dark:text-dark-muted">
        Öğrenci cevabı kaydı bulunmuyor.
      </p>
    );
  }

  return (
    <div className="grid max-h-48 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-4">
      {answers.map((answer, index) => {
        const questionNumber = index + 1;
        const correctAnswer = normalizeAnswer(answerKey[index]);
        const isCorrect = correctSet.has(questionNumber);
        const isWrong = wrongSet.has(questionNumber);
        const isBlank = blankSet.has(questionNumber) || !answer;
        const tone = isCorrect
          ? 'border-emerald-200 bg-emerald-50 text-tertiary dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200'
          : isWrong
            ? 'border-red-200 bg-red-50 text-danger dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200'
            : isBlank
              ? 'border-slate-200 bg-slate-50 text-outline dark:border-white/10 dark:bg-white/5 dark:text-dark-muted'
              : 'border-surface-border bg-white text-muted dark:border-dark-border dark:bg-dark-card dark:text-dark-muted';

        return (
          <div key={questionNumber} className={`rounded-lg border p-2 ${tone}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black">{questionNumber}. Soru</span>
              <span className="text-[11px] font-extrabold">{isCorrect ? 'Doğru' : isWrong ? 'Yanlış' : isBlank ? 'Boş' : 'Kayıt'}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] font-bold">
              <span>Öğrenci: {answer || '-'}</span>
              <span>Doğru: {correctAnswer || '-'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminStudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const [studentProfile, allProgress, allResources, studentAccounts] = await Promise.all([
          getUserProfile(id),
          getProgressForStudent(id),
          getResources({ sortBy: 'newest' }),
          getStudents(),
        ]);
        const accountProfile = studentAccounts.find((item) => (item.uid || item.id) === id);
        setStudent(
          accountProfile
            ? {
                ...studentProfile,
                ...accountProfile,
                fullname: studentProfile?.fullname || accountProfile.fullname,
                progressCollection: studentProfile?.progressCollection || accountProfile.progressCollection,
                lastLoginAt: accountProfile.lastLoginAt || studentProfile?.lastLoginAt || null,
              }
            : studentProfile,
        );
        setProgress(allProgress);
        setResources(allResources);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id]);

  const resourceMap = useMemo(
    () => resources.reduce((acc, resource) => ({ ...acc, [resource.id]: resource }), {}),
    [resources],
  );

  const summary = useMemo(() => {
    const solvedKeys = new Set();
    progress.forEach((item) => {
      if (isSolvedProgressItem(item)) {
        solvedKeys.add(progressItemKey(item));
      }
    });
    const completed = solvedKeys.size;
    const scores = progress.filter((item) => typeof item.score === 'number').map((item) => item.score);
    const categoryBuckets = progress.reduce((acc, item) => {
      const category = item.category || 'testler';
      const current = acc[category] || { totalKeys: new Set(), solvedKeys: new Set() };
      const key = progressItemKey(item);
      current.totalKeys.add(key);
      if (isSolvedProgressItem(item)) current.solvedKeys.add(key);
      acc[category] = current;
      return acc;
    }, {});
    const byCategory = Object.entries(categoryBuckets).reduce((acc, [category, bucket]) => {
      acc[category] = {
        total: bucket.totalKeys.size,
        completed: bucket.solvedKeys.size,
      };
      return acc;
    }, {});

    return {
      completed,
      averageScore: scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : '-',
      byCategory,
    };
  }, [progress]);

  const solvedProgress = useMemo(() => uniqueSolvedProgress(progress), [progress]);

  if (loading) return <LoadingSpinner label="Öğrenci detayı yükleniyor" />;
  if (!student || student.role !== 'student') {
    return <EmptyState title="Öğrenci bulunamadı" description="Bu öğrenci profili mevcut değil." />;
  }

  return (
    <div className="space-y-6">
      <Button as={Link} to="/admin/students" variant="ghost" icon={ArrowLeft}>
        Listeye Dön
      </Button>

      <section className="surface-card p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          {student.profilePhotoURL ? (
            <img src={student.profilePhotoURL} alt={student.name} className="h-24 w-24 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-primary-soft text-4xl font-extrabold text-primary dark:bg-primary/15 dark:text-primary-muted">
              {(student.name || 'Ö').slice(0, 1).toLocaleUpperCase('tr-TR')}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold text-ink dark:text-white">{student.name}</h1>
              <Badge value={student.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted dark:text-dark-muted md:grid-cols-2">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {student.email}
              </span>
              <span className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {student.gradeLevel || 'Sınıf bilgisi yok'}
              </span>
              <span>Oluşturma: {formatDate(student.createdAt)}</span>
              <span>Son giriş: {formatDateTime(student.lastLoginAt)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Toplam İlerleme</p>
          <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{progress.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Tamamlanan Kaynak</p>
          <p className="mt-2 text-3xl font-extrabold text-tertiary dark:text-emerald-200">{summary.completed}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Ortalama Puan</p>
          <p className="mt-2 text-3xl font-extrabold text-primary dark:text-primary-muted">{summary.averageScore}</p>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-xl font-extrabold text-ink dark:text-white">Kategori Bazlı İlerleme</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => (
            <StudentStatsCard
              key={category.id}
              categoryId={category.id}
              total={summary.byCategory[category.id]?.total || 0}
              completed={summary.byCategory[category.id]?.completed || 0}
            />
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <div>
          <h2 className="text-xl font-extrabold text-ink dark:text-white">Çözülen Test Detayları</h2>
          <p className="mt-1 text-sm text-muted dark:text-dark-muted">
            Öğrencinin kaydettiği cevaplar, doğru cevaplar ve soru bazlı değerlendirme.
          </p>
        </div>

        {solvedProgress.length === 0 ? (
          <EmptyState title="Çözülmüş test yok" description="Öğrenci cevap kaydettiğinde detaylar burada görünecek." />
        ) : (
          <div className="mt-4 max-h-[72vh] space-y-3 overflow-y-auto pr-2">
            {solvedProgress.map((item) => {
              const resourceTitle = resourceMap[item.resourceId]?.title || item.resourceTitle || item.resourceId || 'İsimsiz test';
              const scoring = item.scoring || {};

              return (
                <article
                  key={`${item.legacyType}-${item.id}`}
                  className="rounded-xl border border-surface-border bg-white p-4 dark:border-dark-border dark:bg-dark-card"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge value="completed">Tamamlandı</Badge>
                        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary dark:bg-primary/15 dark:text-primary-muted">
                          {item.sourceCollection || item.category || 'Test'}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold text-ink dark:text-white">{resourceTitle}</h3>
                      <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                        Tamamlama: {formatDateTime(item.completedAt || item.updatedAt || item.createdAt)}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center sm:min-w-[320px]">
                      <div className="rounded-lg bg-primary-soft p-2 text-primary dark:bg-primary/15 dark:text-primary-muted">
                        <p className="text-base font-black">{typeof item.score === 'number' ? `%${item.score}` : '-'}</p>
                        <p className="text-[11px] font-bold">Puan</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-2 text-tertiary dark:bg-emerald-500/10 dark:text-emerald-200">
                        <p className="text-base font-black">{scoring.correctCount ?? '-'}</p>
                        <p className="text-[11px] font-bold">Doğru</p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-2 text-danger dark:bg-red-500/10 dark:text-red-200">
                        <p className="text-base font-black">{scoring.wrongCount ?? '-'}</p>
                        <p className="text-[11px] font-bold">Yanlış</p>
                      </div>
                      <div className="rounded-lg bg-surface-low p-2 text-outline dark:bg-dark-surface dark:text-dark-muted">
                        <p className="text-base font-black">{scoring.blankCount ?? '-'}</p>
                        <p className="text-[11px] font-bold">Boş</p>
                      </div>
                    </div>
                  </div>

                  {item.scoring ? (
                    <div className="mt-3 grid gap-2 lg:grid-cols-3">
                      <NumberList
                        title="Doğru Sorular"
                        numbers={scoring.correctQuestions || []}
                        icon={CheckCircle2}
                        tone={{
                          icon: 'bg-emerald-100 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
                          badge: 'bg-emerald-100 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
                        }}
                      />
                      <NumberList
                        title="Yanlış Sorular"
                        numbers={scoring.wrongQuestions || []}
                        icon={XCircle}
                        tone={{
                          icon: 'bg-red-100 text-danger dark:bg-red-500/15 dark:text-red-200',
                          badge: 'bg-red-100 text-danger dark:bg-red-500/15 dark:text-red-200',
                        }}
                      />
                      <NumberList
                        title="Boş Sorular"
                        numbers={scoring.blankQuestions || []}
                        icon={CircleSlash2}
                        tone={{
                          icon: 'bg-slate-200 text-outline dark:bg-white/10 dark:text-dark-muted',
                          badge: 'bg-slate-200 text-outline dark:bg-white/10 dark:text-dark-muted',
                        }}
                      />
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl bg-surface-low p-3 text-sm font-semibold text-muted dark:bg-dark-surface dark:text-dark-muted">
                      Bu test için cevap anahtarı olmadığı için doğru/yanlış değerlendirmesi bulunmuyor.
                    </p>
                  )}

                  <div className="mt-3">
                    <h4 className="mb-2 text-xs font-extrabold uppercase text-outline dark:text-dark-muted">Öğrenci Cevapları</h4>
                    <AnswerGrid item={item} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold text-ink dark:text-white">İlerleme Tablosu</h2>
        <AdminTable
          emptyTitle="İlerleme kaydı yok"
          columns={[
            {
              key: 'resourceId',
              label: 'Kaynak',
              render: (row) => resourceMap[row.resourceId]?.title || row.resourceId,
            },
            { key: 'category', label: 'Kategori' },
            { key: 'status', label: 'Durum', render: (row) => <Badge value={row.status} /> },
            { key: 'score', label: 'Puan', render: (row) => row.score ?? '-' },
            { key: 'completedAt', label: 'Tamamlama', render: (row) => formatDate(row.completedAt) },
            { key: 'updatedAt', label: 'Güncelleme', render: (row) => formatDate(row.updatedAt) },
          ]}
          rows={progress}
        />
      </section>
    </div>
  );
}
