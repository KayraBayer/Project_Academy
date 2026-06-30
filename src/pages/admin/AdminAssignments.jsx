import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Search, Send, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchCombobox from '../../components/common/SearchCombobox';
import { assignHomework } from '../../services/assignmentService';
import { getResources } from '../../services/resourceService';
import { getStudents } from '../../services/userService';
import { categories } from '../../utils/categories';

function resourceBaseLabel(resource) {
  return `${resource.title} · ${resource.gradeLevel} · ${resource.questionCount || '-'} soru`;
}

const gradeOptions = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];

export default function AdminAssignments() {
  const [resources, setResources] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedResourceLabel, setSelectedResourceLabel] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [resourceItems, studentItems] = await Promise.all([
          getResources({ sortBy: 'newest' }),
          getStudents(),
        ]);
        setResources(resourceItems);
        setStudents(studentItems);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const categoryResources = useMemo(
    () => (selectedCategory ? resources.filter((resource) => resource.category === selectedCategory) : []),
    [resources, selectedCategory],
  );
  const publisherOptions = useMemo(
    () => [...new Set(categoryResources.map((resource) => resource.publisher).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [categoryResources],
  );

  const publisherResources = useMemo(
    () => (selectedPublisher ? categoryResources.filter((resource) => resource.publisher === selectedPublisher) : []),
    [categoryResources, selectedPublisher],
  );

  const gradeLevelOptions = useMemo(() => {
    const availableGrades = new Set(publisherResources.map((resource) => resource.gradeLevel).filter(Boolean));
    return gradeOptions.filter((grade) => availableGrades.has(grade));
  }, [publisherResources]);

  const selectableResources = useMemo(
    () =>
      selectedGradeLevel
        ? publisherResources.filter((resource) => resource.gradeLevel === selectedGradeLevel)
        : [],
    [publisherResources, selectedGradeLevel],
  );

  const resourceOptionItems = useMemo(() => {
    const counts = selectableResources.reduce((acc, resource) => {
      const label = resourceBaseLabel(resource);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const seen = {};

    return selectableResources.map((resource) => {
      const baseLabel = resourceBaseLabel(resource);
      seen[baseLabel] = (seen[baseLabel] || 0) + 1;
      return {
        label: counts[baseLabel] > 1 ? `${baseLabel} · ${seen[baseLabel]}. seçenek` : baseLabel,
        resource,
      };
    });
  }, [selectableResources]);
  const resourceOptions = useMemo(() => resourceOptionItems.map((item) => item.label), [resourceOptionItems]);
  const resourceMap = useMemo(
    () =>
      resourceOptionItems.reduce((acc, item) => {
        acc[item.label] = item.resource;
        return acc;
      }, {}),
    [resourceOptionItems],
  );
  const selectedResource = resourceMap[selectedResourceLabel];

  const filteredStudents = useMemo(() => {
    const search = studentSearch.toLocaleLowerCase('tr-TR');
    return students.filter((student) =>
      search
        ? [student.name, student.email].filter(Boolean).some((value) => value.toLocaleLowerCase('tr-TR').includes(search))
        : true,
    );
  }, [studentSearch, students]);

  function toggleStudent(uid) {
    setSelectedStudentIds((current) =>
      current.includes(uid) ? current.filter((item) => item !== uid) : [...current, uid],
    );
  }

  async function handleAssign() {
    if (!selectedCategory || !selectedPublisher || !selectedGradeLevel) {
      toast.error('Önce kategori, yayıncı ve sınıf seçin.');
      return;
    }
    if (!selectedResource) {
      toast.error('Ödev atanacak testi seçin.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error('En az bir öğrenci seçin.');
      return;
    }

    setAssigning(true);
    try {
      const result = await assignHomework({
        resourceId: selectedResource.id,
        studentIds: selectedStudentIds,
      });
      if (!result.assignedCount) {
        toast.error('Seçilen öğrenciler için ödev atanamadı.');
        return;
      }
      toast.success(`${result.assignedCount} öğrenciye ödev atandı.`);
      if (result.missingStudents?.length) {
        toast.error(`${result.missingStudents.length} öğrenci için hesap bilgisi eksik.`);
      }
      setSelectedStudentIds([]);
      setSelectedResourceLabel('');
    } catch (error) {
      toast.error(error.message || 'Ödev atanamadı.');
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <LoadingSpinner label="Ödev atama verileri yükleniyor" />;

  return (
    <div className="space-y-6">
      <section className="animate-rise flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink dark:text-white">Ödev Atama</h1>
          <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
            Bir testi seçip öğrencilerin ödev listesine atayın.
          </p>
        </div>
        <Button icon={Send} loading={assigning} onClick={handleAssign}>
          Ödev Ata
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Toplam Test</p>
          <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{resources.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Öğrenci</p>
          <p className="mt-2 text-3xl font-extrabold text-primary dark:text-primary-muted">{students.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-outline dark:text-dark-muted">Seçili Öğrenci</p>
          <p className="mt-2 text-3xl font-extrabold text-tertiary dark:text-emerald-200">{selectedStudentIds.length}</p>
        </div>
      </section>

      <section className="surface-card space-y-5 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            label="Kategori"
            as="select"
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setSelectedPublisher('');
              setSelectedGradeLevel('');
              setSelectedResourceLabel('');
            }}
          >
            <option value="">Kategori seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Input>
          <SearchCombobox
            label="Yayıncı"
            options={publisherOptions}
            value={selectedPublisher}
            onChange={(value) => {
              setSelectedPublisher(value);
              setSelectedGradeLevel('');
              setSelectedResourceLabel('');
            }}
            placeholder={selectedCategory ? 'Yayıncı seçin' : 'Önce kategori seçin'}
            searchPlaceholder="Yayıncı ara..."
            emptyLabel="Bu kategoride yayıncı yok"
            disabled={!selectedCategory}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SearchCombobox
            label="Sınıf"
            options={gradeLevelOptions}
            value={selectedGradeLevel}
            onChange={(value) => {
              setSelectedGradeLevel(value);
              setSelectedResourceLabel('');
            }}
            placeholder={selectedPublisher ? 'Sınıf seçin' : 'Önce yayıncı seçin'}
            emptyLabel="Bu yayıncıda sınıf bulunamadı"
            disabled={!selectedPublisher}
            searchable={false}
          />
          <SearchCombobox
            label="Atanacak Test"
            options={resourceOptions}
            value={selectedResourceLabel}
            onChange={setSelectedResourceLabel}
            placeholder={selectedGradeLevel ? 'Test seçin' : 'Önce sınıf seçin'}
            searchPlaceholder="Test adı ara..."
            emptyLabel="Bu sınıfta eşleşen test yok"
            disabled={!selectedGradeLevel}
          />
        </div>
        {selectedResource ? (
          <div className="rounded-xl bg-primary-soft/60 p-4 text-sm font-semibold text-primary dark:bg-primary/10 dark:text-primary-muted">
            {selectedResource.publisher} · {selectedResource.gradeLevel} · {selectedResource.questionCount || '-'} soru
          </div>
        ) : null}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="animated-filter grid gap-3 border-b border-surface-border p-4 dark:border-dark-border md:grid-cols-[1fr_auto]">
          <Input
            icon={Search}
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Öğrenci adı veya e-posta ara..."
          />
          <Button
            variant="outline"
            icon={UserCheck}
            onClick={() => setSelectedStudentIds(filteredStudents.map((student) => student.uid || student.id))}
          >
            Görünenleri Seç
          </Button>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={ClipboardCheck} title="Öğrenci bulunamadı" description="Arama kriterini değiştirin." />
          </div>
        ) : (
          <div className="stagger-grid grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student) => {
              const uid = student.uid || student.id;
              const checked = selectedStudentIds.includes(uid);
              return (
                <label
                  key={uid}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                    checked
                      ? 'border-primary bg-primary-soft text-primary dark:border-primary-muted dark:bg-primary/15 dark:text-primary-muted'
                      : 'border-surface-border bg-white hover:border-primary/40 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={checked}
                    onChange={() => toggleStudent(uid)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-ink dark:text-white">{student.name || 'İsimsiz Öğrenci'}</span>
                    <span className="block truncate text-xs text-outline dark:text-dark-muted">{student.email || uid}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
