import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TestSolver from '../../components/resources/TestSolver';
import { useAuth } from '../../contexts/AuthContext';
import { getProgressByResource } from '../../services/progressService';
import { getResourceById } from '../../services/resourceService';

export default function ResourceSolve() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [resource, setResource] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResource() {
      if (!id || !currentUser?.uid) return;
      setLoading(true);
      try {
        const resourceItem = await getResourceById(id);
        const progressItem = resourceItem ? await getProgressByResource(currentUser.uid, id, resourceItem) : null;
        setResource(resourceItem);
        setProgress(progressItem);
      } finally {
        setLoading(false);
      }
    }

    loadResource();
  }, [currentUser?.uid, id]);

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner label="Test hazırlanıyor" />
      </div>
    );
  }

  if (!resource) {
    return <EmptyState title="Test bulunamadı" description="Açmak istediğiniz test silinmiş veya erişime kapatılmış olabilir." />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="surface-card flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink dark:text-white">{resource.title}</p>
          <p className="truncate text-xs text-outline dark:text-dark-muted">
            {resource.publisher} · {resource.gradeLevel}
          </p>
        </div>
        <Button as={Link} to={`/resource/${id}`} variant="outline" size="sm" icon={ArrowLeft} className="shrink-0">
          Detaya Dön
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <TestSolver
          resource={resource}
          currentUser={currentUser}
          progress={progress}
          onSaved={(savedProgress) => setProgress(savedProgress)}
        />
      </div>
    </div>
  );
}
