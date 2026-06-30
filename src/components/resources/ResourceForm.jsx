import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Hash, KeyRound, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import SearchCombobox from '../common/SearchCombobox';
import { createPublisher, getResourceCollections } from '../../services/resourceService';

const gradeOptions = [5, 6, 7, 8];
const gradeLabels = gradeOptions.map((item) => `${item}. Sınıf`);

function formFromInitial(initialData = {}) {
  return {
    sourceCollection: initialData.sourceCollection || initialData.publisher || '',
    title: initialData.title || initialData.name || '',
    grade: initialData.grade || Number(String(initialData.gradeLevel || '').replace(/\D/g, '')) || '',
    questionCount: initialData.questionCount || '',
    answerKey: initialData.answerKey || '',
    externalLink: initialData.externalLink || initialData.link || '',
  };
}

export default function ResourceForm({ initialData, saving = false, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => formFromInitial(initialData));
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [newPublisher, setNewPublisher] = useState('');
  const [creatingPublisher, setCreatingPublisher] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadCollections() {
      setLoadingCollections(true);
      try {
        const items = await getResourceCollections();
        setCollections(items);
      } catch (error) {
        toast.error(error.message || 'Yayıncılar yüklenemedi.');
      } finally {
        setLoadingCollections(false);
      }
    }

    loadCollections();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreatePublisher() {
    const name = newPublisher.trim();
    if (!name) {
      toast.error('Yayıncı adı girin.');
      return;
    }

    setCreatingPublisher(true);
    try {
      const result = await createPublisher(name);
      const publisherName = result.name || name.toLocaleUpperCase('tr-TR');
      setCollections((current) => [...new Set([...current, publisherName])].sort((a, b) => a.localeCompare(b, 'tr')));
      updateField('sourceCollection', publisherName);
      setNewPublisher('');
      toast.success('Yayıncı eklendi.');
    } catch (error) {
      toast.error(error.message || 'Yayıncı eklenemedi.');
    } finally {
      setCreatingPublisher(false);
    }
  }

  function validate() {
    const nextErrors = {};
    if (!form.sourceCollection) nextErrors.sourceCollection = 'Yayıncı seçin.';
    if (!form.title.trim()) nextErrors.title = 'Test adı zorunludur.';
    if (!form.externalLink.trim()) nextErrors.externalLink = 'Google Drive linki zorunludur.';
    if (!gradeOptions.includes(Number(form.grade))) nextErrors.grade = 'Sınıf seçin.';
    if (!Number(form.questionCount)) nextErrors.questionCount = 'Soru sayısı girin.';
    if (!form.answerKey.trim()) nextErrors.answerKey = 'Cevap anahtarı zorunludur.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        sourceCollection: form.sourceCollection,
        title: form.title.trim(),
        grade: Number(form.grade),
        questionCount: Number(form.questionCount),
        answerKey: form.answerKey.trim().toLocaleUpperCase('tr-TR'),
        externalLink: form.externalLink.trim(),
        link: form.externalLink.trim(),
      });
    } catch (error) {
      toast.error(error.message || 'Test kaydedilemedi.');
    }
  }

  if (loadingCollections) return <LoadingSpinner label="Yayıncılar yükleniyor" />;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="surface-card relative z-30 space-y-5 p-5">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white">Yayıncı</h2>
          <p className="mt-1 text-sm text-muted dark:text-dark-muted">Testin bağlı olduğu yayıncıyı seçin veya yeni yayıncı ekleyin.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <SearchCombobox
            label="Yayıncı"
            options={collections}
            value={form.sourceCollection}
            onChange={(value) => updateField('sourceCollection', value)}
            error={errors.sourceCollection}
            placeholder="Yayıncı seçin"
            searchPlaceholder="Yayıncı ara..."
            emptyLabel="Eşleşen yayıncı yok"
            className="relative z-[140]"
            panelClassName="z-[160]"
          />
          <div className="grid gap-2 self-end rounded-xl bg-surface-low/70 p-3 dark:bg-dark-surface sm:grid-cols-[1fr_auto]">
            <Input
              value={newPublisher}
              onChange={(event) => setNewPublisher(event.target.value)}
              placeholder="Yeni yayıncı adı"
              aria-label="Yeni yayıncı adı"
            />
            <Button icon={Plus} loading={creatingPublisher} onClick={handleCreatePublisher} className="sm:self-start">
              Yayıncı Ekle
            </Button>
          </div>
        </div>
      </section>

      <section className="surface-card relative z-0 space-y-5 p-5">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white">Test Bilgileri</h2>
          <p className="mt-1 text-sm text-muted dark:text-dark-muted">Test adı, sınıf, soru sayısı ve bağlantı bilgilerini girin.</p>
        </div>
        <div className="stagger-grid grid gap-5 lg:grid-cols-2">
          <Input
            label="Test Adı"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            error={errors.title}
            placeholder="Örn. 01_ÇARPANLAR VE KATLAR"
          />
          <SearchCombobox
            label="Sınıf"
            options={gradeLabels}
            value={form.grade ? `${form.grade}. Sınıf` : ''}
            onChange={(value) => updateField('grade', Number(String(value).replace(/\D/g, '')))}
            error={errors.grade}
            placeholder="Sınıf seçin"
            emptyLabel="Sınıf bulunamadı"
            searchable={false}
          />
          <Input
            label="Soru Sayısı"
            icon={Hash}
            type="number"
            min="1"
            value={form.questionCount}
            onChange={(event) => updateField('questionCount', event.target.value)}
            error={errors.questionCount}
          />
          <Input
            label="Cevap Anahtarı"
            icon={KeyRound}
            value={form.answerKey}
            onChange={(event) => updateField('answerKey', event.target.value)}
            error={errors.answerKey}
            placeholder="Örn. ABCDABCD"
          />
          <Input
            label="Google Drive PDF Linki"
            icon={ExternalLink}
            value={form.externalLink}
            onChange={(event) => updateField('externalLink', event.target.value)}
            error={errors.externalLink}
            placeholder="https://drive.google.com/..."
            className="lg:col-span-2"
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" icon={ArrowLeft} onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit" icon={Save} loading={saving}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
