import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  HeartPulse,
  Percent,
  SquarePen,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/admin/StatCard';
import { getLoginEvents } from '../../services/analyticsService';
import { getProgressForStudent, isSolvedProgressItem, progressItemKey } from '../../services/progressService';
import { getResources } from '../../services/resourceService';
import { getAllUsers } from '../../services/userService';
import { formatDateTime, toDate } from '../../utils/formatDate';

const dayCount = 7;

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function localDateKey(date) {
  const value = toDate(date);
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayLabel(date) {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date);
}

function buildDays() {
  const today = startOfDay(new Date());
  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(today, index - dayCount + 1);
    return {
      date,
      key: localDateKey(date),
      label: dayLabel(date),
    };
  });
}

function dateValue(item) {
  return toDate(item.completedAt || item.updatedAt || item.createdAt);
}

function uniqueSolvedProgress(items) {
  const map = new Map();

  items.filter(isSolvedProgressItem).forEach((item) => {
    const key = progressItemKey(item);
    const current = map.get(key);
    const itemPriority = item.legacyType === 'submission' ? 2 : 1;
    const currentPriority = current?.legacyType === 'submission' ? 2 : 1;

    if (!current || itemPriority > currentPriority || (dateValue(item)?.getTime() || 0) > (dateValue(current)?.getTime() || 0)) {
      map.set(key, item);
    }
  });

  return [...map.values()];
}

function scoringTotals(items) {
  return items.reduce(
    (acc, item) => {
      const scoring = item.scoring || {};
      const total = Number(scoring.compared || scoring.keyLength || item.questionCount || 0);
      if (typeof scoring.correctCount === 'number' && total > 0) {
        acc.correct += scoring.correctCount;
        acc.total += total;
      }
      return acc;
    },
    { correct: 0, total: 0 },
  );
}

function percentFromTotals(totals) {
  return totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0;
}

function DailyBars({ title, description, data, valueKey, suffix = '', tone = 'primary' }) {
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey] || 0)));
  const barClass =
    tone === 'green'
      ? 'bg-tertiary dark:bg-emerald-400'
      : tone === 'amber'
        ? 'bg-amber dark:bg-orange-300'
        : 'bg-primary dark:bg-primary-muted';

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white">{title}</h2>
          <p className="text-sm text-muted dark:text-dark-muted">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex h-56 items-end gap-2">
        {data.map((item) => {
          const value = Number(item[valueKey] || 0);
          return (
            <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-44 w-full items-end rounded-xl bg-surface-low p-1 dark:bg-dark-surface">
                <div
                  className={`w-full rounded-lg ${barClass} transition-all duration-300`}
                  style={{ height: `${Math.max(6, (value / max) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-black text-ink dark:text-white">
                {value}
                {suffix}
              </span>
              <span className="truncate text-[11px] font-semibold text-outline dark:text-dark-muted">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyLineChart({ title, description, data, valueKey, suffix = '' }) {
  const width = 640;
  const height = 220;
  const paddingX = 28;
  const paddingY = 24;
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey] || 0)));
  const points = data.map((item, index) => {
    const value = Number(item[valueKey] || 0);
    const x = data.length === 1 ? width / 2 : paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (value / max) * (height - paddingY * 2);
    return { ...item, value, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points.at(-1)?.x || paddingX} ${height - paddingY} L ${points[0]?.x || paddingX} ${height - paddingY} Z`;

  return (
    <div className="surface-card p-5">
      <div>
        <h2 className="text-lg font-extrabold text-ink dark:text-white">{title}</h2>
        <p className="text-sm text-muted dark:text-dark-muted">{description}</p>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl bg-surface-low p-3 dark:bg-dark-surface">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="h-64 w-full">
          <defs>
            <linearGradient id="loginLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(47 128 237)" stopOpacity="0.24" />
              <stop offset="100%" stopColor="rgb(47 128 237)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => {
            const y = paddingY + (line / 3) * (height - paddingY * 2);
            return <line key={line} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="currentColor" className="text-surface-border dark:text-dark-border" strokeWidth="1" />;
          })}
          <path d={areaPath} fill="url(#loginLineFill)" />
          <path d={linePath} fill="none" stroke="rgb(47 128 237)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="rgb(47 128 237)" strokeWidth="4" />
              <text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-ink text-[18px] font-black dark:fill-white">
                {point.value}
                {suffix}
              </text>
              <text x={point.x} y={height - 4} textAnchor="middle" className="fill-muted text-[14px] font-bold dark:fill-dark-muted">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function HealthItem({ icon: Icon, title, value, status = 'ok', description }) {
  const tone =
    status === 'warning'
      ? 'bg-amber-soft text-amber dark:bg-orange-500/15 dark:text-orange-200'
      : status === 'danger'
        ? 'bg-danger-soft text-danger dark:bg-danger/15 dark:text-red-200'
        : 'bg-tertiary-soft text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200';

  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 dark:border-dark-border dark:bg-dark-card">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-extrabold text-ink dark:text-white">{title}</p>
          <p className="mt-1 text-sm font-bold text-primary dark:text-primary-muted">{value}</p>
          {description ? <p className="mt-1 text-xs text-muted dark:text-dark-muted">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loginEvents, setLoginEvents] = useState([]);
  const [loadErrors, setLoadErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setLoadErrors([]);

      const errors = [];
      const [userResult, resourceResult, loginResult] = await Promise.allSettled([
        getAllUsers(),
        getResources({ sortBy: 'newest' }),
        getLoginEvents(),
      ]);

      const userItems = userResult.status === 'fulfilled' ? userResult.value : [];
      const resourceItems = resourceResult.status === 'fulfilled' ? resourceResult.value : [];
      const loginItems = loginResult.status === 'fulfilled' ? loginResult.value : [];

      if (userResult.status === 'rejected') errors.push('Kullanıcı verisi okunamadı.');
      if (resourceResult.status === 'rejected') errors.push('Kaynak verisi okunamadı.');
      if (loginResult.status === 'rejected') errors.push('Giriş geçmişi okunamadı.');

      const students = userItems.filter((user) => user.role === 'student');
      const progressResults = await Promise.allSettled(students.map((student) => getProgressForStudent(student.uid || student.id)));
      const progressItems = progressResults.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);
      const failedProgressReads = progressResults.filter((result) => result.status === 'rejected').length;
      if (failedProgressReads) errors.push(`${failedProgressReads} öğrencinin ilerleme verisi okunamadı.`);

      setUsers(userItems);
      setResources(resourceItems);
      setLoginEvents(loginItems);
      setProgress(progressItems);
      setLoadErrors(errors);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const dashboardData = useMemo(() => {
    const days = buildDays();
    const students = users.filter((user) => user.role === 'student');
    const activeStudents = students.filter((student) => student.status === 'active');
    const solvedProgress = uniqueSolvedProgress(progress);
    const todayKey = localDateKey(new Date());
    const lastSevenKeys = new Set(days.map((day) => day.key));

    const solvedByDay = days.map((day) => {
      const items = solvedProgress.filter((item) => localDateKey(dateValue(item)) === day.key);
      const totals = scoringTotals(items);
      return {
        ...day,
        solved: items.length,
        correctRate: percentFromTotals(totals),
      };
    });

    const loginSets = days.reduce((acc, day) => ({ ...acc, [day.key]: new Set() }), {});
    loginEvents.forEach((event) => {
      const key = event.dateKey || localDateKey(event.createdAt);
      if (loginSets[key] && (!event.role || event.role === 'student')) {
        loginSets[key].add(event.userId || event.uid || event.email || event.id);
      }
    });
    students.forEach((student) => {
      const key = localDateKey(student.lastLoginAt);
      if (loginSets[key]) loginSets[key].add(student.uid || student.id || student.email);
    });

    const loginsByDay = days.map((day) => ({
      ...day,
      logins: loginSets[day.key]?.size || 0,
    }));

    const todaySolvedItems = solvedProgress.filter((item) => localDateKey(dateValue(item)) === todayKey);
    const todayCorrectRate = percentFromTotals(scoringTotals(todaySolvedItems));
    const allCorrectRate = percentFromTotals(scoringTotals(solvedProgress));
    const activeLastSeven = students.filter((student) => lastSevenKeys.has(localDateKey(student.lastLoginAt))).length;
    const missingLinks = resources.filter((resource) => !(resource.fileURL || resource.externalLink || resource.link)).length;
    const missingAnswerKeys = resources.filter((resource) => !String(resource.answerKey || '').replace(/[^ABCDabcd]/g, '')).length;
    const missingQuestionCounts = resources.filter((resource) => !Number(resource.questionCount || 0)).length;
    const scoredSolved = solvedProgress.filter((item) => item.scoring).length;
    const completedAssignments = progress.filter((item) => item.legacyType === 'assignment' && isSolvedProgressItem(item)).length;

    return {
      students,
      activeStudents,
      solvedProgress,
      solvedByDay,
      loginsByDay,
      todaySolved: todaySolvedItems.length,
      todayCorrectRate,
      todayLogins: loginsByDay.find((day) => day.key === todayKey)?.logins || 0,
      lastSevenSolved: solvedByDay.reduce((total, day) => total + day.solved, 0),
      activeLastSeven,
      allCorrectRate,
      missingLinks,
      missingAnswerKeys,
      missingQuestionCounts,
      scoredSolved,
      totalStudents: students.length,
      totalResources: resources.length,
      activeStudentsCount: activeStudents.length,
      completedAssignments,
    };
  }, [loginEvents, progress, resources, users]);

  if (loading) return <LoadingSpinner label="Admin paneli yükleniyor" />;

  const healthStatus = loadErrors.length ? 'warning' : 'ok';

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink dark:text-white">Genel Durum Paneli</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            Günlük çözüm, giriş ve sistem sağlığı metrikleri.
          </p>
        </div>
        <Button as={Link} to="/admin/resources/new" icon={SquarePen}>
          Yeni Test Ekle
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Toplam Öğrenci" value={dashboardData.totalStudents} icon={UsersRound} tone="primary" description="Kayıtlı öğrenci" />
        <StatCard title="Toplam Test" value={dashboardData.totalResources} icon={BookOpen} tone="secondary" description="Sistemdeki kaynak" />
        <StatCard title="Aktif Öğrenci" value={dashboardData.activeStudentsCount} icon={UserCheck} tone="tertiary" description="Aktif hesap" />
        <StatCard title="Çözülen Test" value={dashboardData.solvedProgress.length} icon={CheckCircle2} tone="rose" description="Tekil çözüm" />
        <StatCard title="Puanlanan Çözüm" value={dashboardData.scoredSolved} icon={FileText} tone="amber" description="Cevap anahtarlı" />
        <StatCard title="Tamamlanan Ödev" value={dashboardData.completedAssignments} icon={ClipboardCheck} tone="primary" description="Atanmış test" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Bugün Çözülen" value={dashboardData.todaySolved} icon={ClipboardCheck} tone="primary" description="Kaydedilen test" />
        <StatCard title="Bugünkü Doğru" value={`%${dashboardData.todayCorrectRate}`} icon={Percent} tone="tertiary" description="Doğru cevap oranı" />
        <StatCard title="Bugün Giriş" value={dashboardData.todayLogins} icon={UserCheck} tone="secondary" description="Tekil öğrenci" />
        <StatCard title="Son 7 Gün Çözüm" value={dashboardData.lastSevenSolved} icon={CheckCircle2} tone="rose" description="Toplam test" />
        <StatCard title="Son 7 Gün Aktif" value={dashboardData.activeLastSeven} icon={UsersRound} tone="amber" description="Son girişe göre" />
        <StatCard title="Genel Doğru" value={`%${dashboardData.allCorrectRate}`} icon={Activity} tone="primary" description="Tüm puanlı çözümler" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DailyBars
            title="Günlük Çözülen Test"
            description="Son 7 günde kaydedilen çözüm sayısı"
            data={dashboardData.solvedByDay}
            valueKey="solved"
          />
        </div>
        <DailyBars
          title="Günlük Doğru Yüzdesi"
          description="Puanlanan çözümler üzerinden"
          data={dashboardData.solvedByDay}
          valueKey="correctRate"
          suffix="%"
          tone="green"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DailyLineChart
          title="Günlük Giriş Yapan Öğrenci"
          description="Login event ve son giriş verilerine göre tekil öğrenci"
          data={dashboardData.loginsByDay}
          valueKey="logins"
        />

        <div className="surface-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-ink dark:text-white">Sitenin Sağlık Durumu</h2>
              <p className="text-sm text-muted dark:text-dark-muted">Veri erişimi ve içerik kalitesi kontrolleri</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${healthStatus === 'ok' ? 'bg-tertiary-soft text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-amber-soft text-amber dark:bg-orange-500/15 dark:text-orange-200'}`}>
              {healthStatus === 'ok' ? 'Sağlıklı' : 'Kontrol Gerekli'}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <HealthItem
              icon={Database}
              title="Firebase Veri Erişimi"
              value={loadErrors.length ? `${loadErrors.length} uyarı` : 'Bağlantı başarılı'}
              status={loadErrors.length ? 'warning' : 'ok'}
              description={loadErrors[0] || 'Kullanıcı, kaynak ve ilerleme verileri okunuyor.'}
            />
            <HealthItem
              icon={BookOpen}
              title="Eksik Test Linki"
              value={`${dashboardData.missingLinks} test`}
              status={dashboardData.missingLinks ? 'warning' : 'ok'}
              description="Öğrencinin açamayacağı testleri işaretler."
            />
            <HealthItem
              icon={AlertTriangle}
              title="Eksik Cevap Anahtarı"
              value={`${dashboardData.missingAnswerKeys} test`}
              status={dashboardData.missingAnswerKeys ? 'warning' : 'ok'}
              description="Puanlama yapılamayan test sayısı."
            />
            <HealthItem
              icon={HeartPulse}
              title="Puanlanan Çözüm"
              value={`${dashboardData.scoredSolved} kayıt`}
              status={dashboardData.scoredSolved ? 'ok' : 'warning'}
              description={`Soru sayısı eksik test: ${dashboardData.missingQuestionCounts}`}
            />
          </div>

          <p className="mt-4 text-xs text-outline dark:text-dark-muted">
            Son kontrol: {formatDateTime(new Date())}
          </p>
        </div>
      </section>
    </div>
  );
}
