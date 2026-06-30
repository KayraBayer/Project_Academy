import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Pencil, Plus, Search, Trash2, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminTable from '../../components/admin/AdminTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  createStudentProfile,
  deleteUserProfile,
  getAllUsers,
  sendAccountPasswordReset,
  updateUserProfile,
} from '../../services/userService';
import { formatDate } from '../../utils/formatDate';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  gradeLevel: '',
  role: 'student',
  status: 'active',
};

const gradeOptions = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];

function AccountForm({ initialData = emptyForm, title, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialData });
  const isEdit = Boolean(initialData.uid || initialData.id);

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
        <Input label="Ad Soyad" value={form.name} onChange={(event) => update('name', event.target.value)} required />
        <Input
          label="E-posta"
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          required
          disabled={isEdit}
        />
        {!isEdit ? (
          <Input
            label="Geçici Şifre"
            type="password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            placeholder="En az 6 karakter"
            required
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Sınıf Seviyesi" as="select" value={form.gradeLevel || ''} onChange={(event) => update('gradeLevel', event.target.value)}>
            <option value="">Sınıf seçin</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </Input>
          <Input label="Durum" as="select" value={form.status} onChange={(event) => update('status', event.target.value)}>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
            <option value="suspended">Askıda</option>
          </Input>
        </div>
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

export default function AdminAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(await getAllUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch = search
        ? [user.name, user.email]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
        : true;
      const roleMatch = role ? user.role === role : true;
      const statusMatch = status ? user.status === status : true;
      return searchMatch && roleMatch && statusMatch;
    });
  }, [role, search, status, users]);

  async function handleCreate(form) {
    setSubmitting(true);
    try {
      await createStudentProfile({ ...form, role: 'student' });
      toast.success('Hesap oluşturuldu.');
      setCreateOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Hesap oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(form) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateUserProfile(editTarget.uid || editTarget.id, {
        name: form.name,
        gradeLevel: form.gradeLevel,
        role: editTarget.role || 'student',
        status: form.status,
        profilePhotoURL: form.profilePhotoURL || null,
      });
      toast.success('Hesap güncellendi.');
      setEditTarget(null);
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Hesap güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(user, nextStatus) {
    try {
      await updateUserProfile(user.uid || user.id, {
        name: user.name,
        role: user.role,
        gradeLevel: user.gradeLevel,
        status: nextStatus,
      });
      toast.success('Hesap durumu güncellendi.');
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Durum güncellenemedi.');
    }
  }

  async function resetPassword(user) {
    try {
      await sendAccountPasswordReset(user.email);
      toast.success('Şifre sıfırlama e-postası gönderildi.');
    } catch (error) {
      toast.error(error.message || 'E-posta gönderilemedi.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteUserProfile(deleteTarget.uid || deleteTarget.id);
      toast.success('Hesap tamamen silindi.');
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Hesap silinemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Hesaplar yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink dark:text-white">Hesap Yönetimi</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            Öğrenci hesaplarını yönetin, hesap durumlarını güncelleyin ve şifre sıfırlama e-postası gönderin.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Öğrenci Oluştur
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Toplam Kullanıcı</p>
          <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{users.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Aktif Hesap</p>
          <p className="mt-2 text-3xl font-extrabold text-tertiary dark:text-emerald-200">
            {users.filter((user) => user.status === 'active').length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Öğrenci</p>
          <p className="mt-2 text-3xl font-extrabold text-primary dark:text-primary-muted">
            {users.filter((user) => user.role === 'student').length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Askıda</p>
          <p className="mt-2 text-3xl font-extrabold text-danger">
            {users.filter((user) => user.status === 'suspended').length}
          </p>
        </div>
      </section>

      <div className="animated-filter surface-card grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <Input icon={Search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="İsim veya e-posta ara..." />
        <Input as="select" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">Tüm Roller</option>
          <option value="student">Öğrenci</option>
          <option value="admin">Admin</option>
        </Input>
        <Input as="select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="suspended">Askıda</option>
        </Input>
      </div>

      <AdminTable
        emptyTitle="Hesap bulunamadı"
        columns={[
          {
            key: 'user',
            label: 'Kullanıcı',
            render: (row) => (
              <div>
                <p className="font-bold text-ink dark:text-white">{row.name || 'İsimsiz Kullanıcı'}</p>
                <p className="text-xs text-outline dark:text-dark-muted">{row.email}</p>
              </div>
            ),
          },
          { key: 'role', label: 'Rol', render: (row) => <Badge value={row.role}>{row.role === 'admin' ? 'Admin' : 'Öğrenci'}</Badge> },
          { key: 'status', label: 'Durum', render: (row) => <Badge value={row.status} /> },
          { key: 'lastLoginAt', label: 'Son Giriş', render: (row) => formatDate(row.lastLoginAt) },
          {
            key: 'actions',
            label: 'İşlemler',
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" icon={KeyRound} onClick={() => resetPassword(row)}>
                  Şifre
                </Button>
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditTarget(row)}>
                  Düzenle
                </Button>
                {row.status === 'suspended' ? (
                  <Button variant="ghost" size="sm" icon={CheckCircle2} onClick={() => changeStatus(row, 'active')}>
                    Aktifleştir
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" icon={UserX} className="text-danger" onClick={() => changeStatus(row, 'suspended')}>
                    Askıya Al
                  </Button>
                )}
                <Button variant="ghost" size="sm" icon={Trash2} className="text-danger" onClick={() => setDeleteTarget(row)}>
                  Sil
                </Button>
              </div>
            ),
          },
        ]}
        rows={filteredUsers}
      />

      {createOpen ? (
        <AccountForm title="Öğrenci Hesabı Oluştur" onClose={() => setCreateOpen(false)} onSubmit={handleCreate} submitting={submitting} />
      ) : null}
      {editTarget ? (
        <AccountForm
          title="Hesabı Düzenle"
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hesabı tamamen sil"
        description={`${deleteTarget?.email || 'Bu hesap'} ve bağlı öğrenci kayıtları kalıcı olarak silinecek.`}
        confirmLabel="Evet, Sil"
        loading={submitting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
