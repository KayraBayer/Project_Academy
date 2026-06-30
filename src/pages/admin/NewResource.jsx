import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ResourceForm from '../../components/resources/ResourceForm';
import { useAuth } from '../../contexts/AuthContext';
import { createResource } from '../../services/resourceService';

export default function NewResource() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      await createResource(payload, currentUser.uid);
      toast.success('Test oluşturuldu.');
      navigate('/admin/resources');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-primary dark:text-primary-muted">Test Yönetimi</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink dark:text-white">Yeni Test Ekle</h1>
      </div>
      <ResourceForm saving={saving} onSubmit={handleSubmit} onCancel={() => navigate('/admin/resources')} />
    </div>
  );
}
