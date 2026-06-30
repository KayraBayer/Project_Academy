import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminTable from '../../components/admin/AdminTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../../services/announcementService';
import { formatDate } from '../../utils/formatDate';

const emptyForm = {
  title: '',
  content: '',
  isActive: true,
};

function AnnouncementForm({ title, initialData = emptyForm, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    content: initialData.content || '',
    isActive: initialData.isActive ?? true,
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal open title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <Input label="Başlık" value={form.title} onChange={(event) => update('title', event.target.value)} required />
        <Input
          label="İçerik"
          as="textarea"
          value={form.content}
          onChange={(event) => update('content', event.target.value)}
          inputClassName="min-h-32 resize-y"
          required
        />
        <Input
          label="Durum"
          as="select"
          value={form.isActive ? 'active' : 'passive'}
          onChange={(event) => update('isActive', event.target.value === 'active')}
        >
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </Input>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" loading={submitting}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AnnouncementStatusSwitch({ active, loading, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={loading}
      onClick={onChange}
      className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border p-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-70 ${
        active
          ? 'border-primary/30 bg-primary shadow-[0_10px_24px_-16px_rgba(47,128,237,0.9)]'
          : 'border-surface-border bg-surface-low dark:border-dark-border dark:bg-dark-surface'
      }`}
      title={active ? 'Pasifleştir' : 'Aktifleştir'}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${
          active ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
      <span className="sr-only">{active ? 'Duyuruyu pasifleştir' : 'Duyuruyu aktifleştir'}</span>
    </button>
  );
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  async function loadAnnouncements() {
    setLoading(true);
    try {
      setAnnouncements(await getAnnouncements());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function handleCreate(form) {
    setSubmitting(true);
    try {
      await createAnnouncement(form);
      toast.success('Duyuru oluşturuldu.');
      setCreateOpen(false);
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Duyuru oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(form) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateAnnouncement(editTarget.id, form);
      toast.success('Duyuru güncellendi.');
      setEditTarget(null);
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Duyuru güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(announcement) {
    setStatusUpdatingId(announcement.id);
    try {
      await updateAnnouncement(announcement.id, { isActive: !announcement.isActive });
      toast.success('Duyuru durumu güncellendi.');
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Durum güncellenemedi.');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteAnnouncement(deleteTarget.id);
      toast.success('Duyuru silindi.');
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Duyuru silinemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Duyurular yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink dark:text-white">Duyurular</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            Öğrencilere gösterilecek duyuruları yönetin.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Duyuru Oluştur
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Toplam Duyuru</p>
          <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{announcements.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Aktif</p>
          <p className="mt-2 text-3xl font-extrabold text-tertiary dark:text-emerald-200">
            {announcements.filter((item) => item.isActive).length}
          </p>
        </div>
      </section>

      <AdminTable
        emptyTitle="Duyuru bulunamadı"
        columns={[
          {
            key: 'title',
            label: 'Duyuru',
            render: (row) => (
              <div className="max-w-md">
                <p className="font-bold text-ink dark:text-white">{row.title}</p>
                <p className="line-clamp-2 text-xs text-outline dark:text-dark-muted">{row.content}</p>
              </div>
            ),
          },
          { key: 'isActive', label: 'Durum', render: (row) => <Badge value={row.isActive ? 'active' : 'passive'} /> },
          { key: 'createdAt', label: 'Tarih', render: (row) => formatDate(row.createdAt) },
          {
            key: 'actions',
            label: 'İşlemler',
            render: (row) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <AnnouncementStatusSwitch
                  active={row.isActive}
                  loading={statusUpdatingId === row.id}
                  onChange={() => toggleActive(row)}
                />
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditTarget(row)}>
                  Düzenle
                </Button>
                <Button variant="ghost" size="sm" icon={Trash2} className="text-danger" onClick={() => setDeleteTarget(row)}>
                  Sil
                </Button>
              </div>
            ),
          },
        ]}
        rows={announcements}
      />

      {createOpen ? (
        <AnnouncementForm title="Duyuru Oluştur" onClose={() => setCreateOpen(false)} onSubmit={handleCreate} submitting={submitting} />
      ) : null}
      {editTarget ? (
        <AnnouncementForm
          title="Duyuruyu Düzenle"
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Duyuruyu sil"
        description={`${deleteTarget?.title || 'Bu duyuru'} kalıcı olarak silinecek.`}
        confirmLabel="Evet, Sil"
        loading={submitting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
