import { Search } from 'lucide-react';
import Input from '../common/Input';

export default function ResourceFilters({
  search,
  onSearch,
  subject,
  onSubject,
  subjects = [],
  gradeLevel,
  onGradeLevel,
  gradeLevels = [],
  sortBy,
  onSortBy,
}) {
  return (
    <div className="animated-filter surface-card grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
      <Input
        icon={Search}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Başlık, yayıncı veya konu ara..."
        aria-label="Kaynak ara"
      />
      <Input as="select" value={subject} onChange={(event) => onSubject(event.target.value)} aria-label="Konu filtresi">
        <option value="">Tüm Konular</option>
        {subjects.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Input>
      <Input
        as="select"
        value={gradeLevel}
        onChange={(event) => onGradeLevel(event.target.value)}
        aria-label="Sınıf filtresi"
      >
        <option value="">Tüm Sınıflar</option>
        {gradeLevels.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Input>
      <Input as="select" value={sortBy} onChange={(event) => onSortBy(event.target.value)} aria-label="Sıralama">
        <option value="newest">En Yeni</option>
        <option value="grade">Sınıfa Göre</option>
        <option value="popular">Popüler</option>
        <option value="title">Başlığa Göre</option>
      </Input>
    </div>
  );
}
