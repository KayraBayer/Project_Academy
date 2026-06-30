import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ClipboardCheck, Eye, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  deleteNotification,
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';
import { formatDateTime } from '../../utils/formatDate';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      setNotifications(await getAdminNotifications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.read), [notifications]);
  const completedHomeworkCount = notifications.filter((item) => item.type === 'homework_completed').length;

  async function handleMarkRead(id) {
    setSaving(true);
    try {
      await markNotificationRead(id);
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true, readAt: new Date() } : item)));
    } catch (error) {
      toast.error(error.message || 'Bildirim güncellenemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAllRead() {
    if (!unreadNotifications.length) return;
    setSaving(true);
    try {
      await markAllNotificationsRead(unreadNotifications.map((item) => item.id));
      setNotifications((current) => current.map((item) => ({ ...item, read: true, readAt: item.readAt || new Date() })));
      toast.success('Tüm bildirimler okundu olarak işaretlendi.');
    } catch (error) {
      toast.error(error.message || 'Bildirimler güncellenemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    try {
      await deleteNotification(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
      toast.success('Bildirim silindi.');
    } catch (error) {
      toast.error(error.message || 'Bildirim silinemedi.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Bildirimler yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-primary dark:text-primary-muted">Yönetim</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">Bildirimler</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            Öğrenciler atanan ödevleri tamamladığında burada kayıt oluşur.
          </p>
        </div>
        <Button variant="outline" icon={CheckCheck} disabled={!unreadNotifications.length || saving} onClick={handleMarkAllRead}>
          Tümünü Okundu Yap
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-sm font-bold text-outline dark:text-dark-muted">Toplam Bildirim</p>
          <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{notifications.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-bold text-outline dark:text-dark-muted">Okunmamış</p>
          <p className="mt-2 text-3xl font-extrabold text-primary dark:text-primary-muted">{unreadNotifications.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-bold text-outline dark:text-dark-muted">Tamamlanan Ödev</p>
          <p className="mt-2 text-3xl font-extrabold text-tertiary dark:text-emerald-200">{completedHomeworkCount}</p>
        </div>
      </section>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Bildirim yok" description="Öğrenciler ödev tamamladığında bildirimler burada görünecek." />
      ) : (
        <section className="surface-card overflow-hidden">
          <div className="divide-y divide-surface-border dark:divide-dark-border">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`grid gap-4 p-5 transition-colors md:grid-cols-[1fr_auto] ${
                  notification.read ? 'bg-white dark:bg-dark-card' : 'bg-primary-soft/45 dark:bg-primary/10'
                }`}
              >
                <div className="flex min-w-0 gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-ink dark:text-white">{notification.title || 'Bildirim'}</h2>
                      {!notification.read ? (
                        <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-extrabold text-white">Yeni</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted dark:text-dark-muted">{notification.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-outline dark:text-dark-muted">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-low px-2.5 py-1 dark:bg-dark-surface">
                        <UserRound className="h-3.5 w-3.5" />
                        {notification.studentName || notification.studentId || 'Öğrenci'}
                      </span>
                      <span className="rounded-full bg-surface-low px-2.5 py-1 dark:bg-dark-surface">
                        {formatDateTime(notification.createdAt)}
                      </span>
                      {typeof notification.score === 'number' ? (
                        <span className="rounded-full bg-tertiary-soft px-2.5 py-1 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200">
                          Puan %{notification.score}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {notification.resourceId ? (
                    <Button as={Link} to={`/admin/resources/view/${notification.resourceId}`} variant="outline" size="sm" icon={Eye}>
                      Test
                    </Button>
                  ) : null}
                  {!notification.read ? (
                    <Button variant="ghost" size="sm" icon={CheckCheck} disabled={saving} onClick={() => handleMarkRead(notification.id)}>
                      Okundu
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" icon={Trash2} disabled={saving} className="text-danger" onClick={() => handleDelete(notification.id)}>
                    Sil
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
