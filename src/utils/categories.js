export const categories = [
  {
    id: 'denemeler',
    name: 'Denemeler',
    description: 'Genel sınav pratiği için deneme kaynakları',
    color: 'blue',
  },
  {
    id: 'haftalik-denemeler',
    name: 'Haftalık Denemeler',
    description: 'Haftalık düzenli çalışma ve ölçme denemeleri',
    color: 'sky',
  },
  {
    id: 'yayinlar',
    name: 'Yayınlar',
    description: 'Farklı yayınevlerinden seçilmiş kaynaklar',
    color: 'pink',
  },
  {
    id: 'testler',
    name: 'Testler',
    description: 'Konu bazlı testler ve pratik sorular',
    color: 'green',
  },
  {
    id: 'yazili-ornekleri',
    name: 'Yazılı Örnekleri',
    description: 'Okul yazılılarına hazırlık örnekleri',
    color: 'orange',
  },
];

export const categoryMap = categories.reduce((acc, category) => {
  acc[category.id] = category;
  return acc;
}, {});

export const categoryTone = {
  blue: {
    card: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
    accent: 'from-blue-100 to-secondary-soft dark:from-blue-500/15 dark:to-blue-500/5',
  },
  sky: {
    card: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/20',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    accent: 'from-sky-100 to-primary-soft dark:from-sky-500/15 dark:to-sky-500/5',
  },
  pink: {
    card: 'bg-pink-50 text-rose border-pink-100 dark:bg-pink-500/10 dark:text-pink-200 dark:border-pink-500/20',
    icon: 'bg-pink-100 text-rose dark:bg-pink-500/15 dark:text-pink-200',
    accent: 'from-pink-100 to-rose-soft dark:from-pink-500/15 dark:to-pink-500/5',
  },
  green: {
    card: 'bg-emerald-50 text-tertiary border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20',
    icon: 'bg-emerald-100 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
    accent: 'from-emerald-100 to-tertiary-soft dark:from-emerald-500/15 dark:to-emerald-500/5',
  },
  orange: {
    card: 'bg-orange-50 text-amber border-orange-100 dark:bg-orange-500/10 dark:text-orange-200 dark:border-orange-500/20',
    icon: 'bg-orange-100 text-amber dark:bg-orange-500/15 dark:text-orange-200',
    accent: 'from-orange-100 to-amber-soft dark:from-orange-500/15 dark:to-orange-500/5',
  },
};

export function getCategory(id) {
  return categoryMap[id] || categories[0];
}

export function getCategoryName(id) {
  return getCategory(id).name;
}
