import { Save, Settings } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { categories } from '../../utils/categories';

export default function AdminSettings() {
  const [siteTitle, setSiteTitle] = useState('Erdinç Bayer Akademi');
  const [themePreference, setThemePreference] = useState('system');
  const [visibleCategories, setVisibleCategories] = useState(() =>
    categories.reduce((acc, category) => ({ ...acc, [category.id]: true }), {}),
  );

  function saveSettings(event) {
    event.preventDefault();
    toast.success('Ayarlar kaydedildi.');
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-extrabold text-ink dark:text-white">Ayarlar</h1>
        <p className="mt-2 max-w-2xl text-muted dark:text-dark-muted">
          Site başlığı, tema tercihi ve kategori görünürlüğü için genel yönetim alanı.
        </p>
      </section>

      <form className="grid gap-6 lg:grid-cols-[1fr_0.8fr]" onSubmit={saveSettings}>
        <div className="surface-card space-y-5 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted">
              <Settings className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-extrabold text-ink dark:text-white">Genel Ayarlar</h2>
              <p className="text-sm text-muted dark:text-dark-muted">Site ayarlarını buradan düzenleyebilirsiniz.</p>
            </div>
          </div>

          <Input label="Site Başlığı" value={siteTitle} onChange={(event) => setSiteTitle(event.target.value)} />
          <Input label="Tema Tercihi" as="select" value={themePreference} onChange={(event) => setThemePreference(event.target.value)}>
            <option value="system">Sistem Varsayılanı</option>
            <option value="light">Açık Tema</option>
            <option value="dark">Koyu Tema</option>
          </Input>
          <Button type="submit" icon={Save}>
            Ayarları Kaydet
          </Button>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-extrabold text-ink dark:text-white">Kategori Görünürlüğü</h2>
          <p className="mt-1 text-sm text-muted dark:text-dark-muted">Öğrencilerin görebileceği kategorileri seçin.</p>
          <div className="mt-5 space-y-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-low p-4 dark:border-dark-border dark:bg-dark-surface"
              >
                <span>
                  <span className="block font-bold text-ink dark:text-white">{category.name}</span>
                  <span className="text-sm text-muted dark:text-dark-muted">{category.description}</span>
                </span>
                <input
                  type="checkbox"
                  checked={visibleCategories[category.id]}
                  onChange={(event) =>
                    setVisibleCategories((current) => ({ ...current, [category.id]: event.target.checked }))
                  }
                  className="h-5 w-5 rounded border-surface-border text-primary focus:ring-primary dark:border-dark-border"
                />
              </label>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
