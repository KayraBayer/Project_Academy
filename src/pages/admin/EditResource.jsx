import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ResourceForm from '../../components/resources/ResourceForm';
import { getResourceById, updateResource } from '../../services/resourceService';

export default function EditResource() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadResource() {
      setLoading(true);
      try {
        setResource(await getResourceById(id));
      } finally {
        setLoading(false);
      }
    }

    loadResource();
  }, [id]);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      await updateResource(id, payload);
      toast.success('Test güncellendi.');
      navigate('/admin/resources');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Test yükleniyor" />;
  if (!resource) return <EmptyState title="Test bulunamadı" description="Düzenlemek istediğiniz test bulunamadı." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-primary dark:text-primary-muted">Test Yönetimi</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">Testi Düzenle</h1>
      </div>
      <ResourceForm initialData={resource} saving={saving} onSubmit={handleSubmit} onCancel={() => navigate('/admin/resources')} />
    </div>
  );
}
