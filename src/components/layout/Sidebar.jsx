import { Link, NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  SquarePen,
  UsersRound,
} from 'lucide-react';
import { categories } from '../../utils/categories';

const categoryIcons = {
  denemeler: ClipboardList,
  'haftalik-denemeler': CalendarDays,
  yayinlar: BookOpen,
  testler: SquarePen,
  'yazili-ornekleri': FileText,
};

const mainLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/resources', label: 'Kaynak Yönetimi', icon: BookOpen },
];

const bottomLinks = [
  { to: '/admin/assignments', label: 'Ödev Atama', icon: ClipboardCheck },
  { to: '/admin/students', label: 'Öğrenci İstatistikleri', icon: BarChart3 },
  { to: '/admin/accounts', label: 'Hesap Yönetimi', icon: UsersRound },
  { to: '/admin/announcements', label: 'Duyurular', icon: Megaphone },
];

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `mx-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
          isActive
            ? 'translate-x-1 bg-primary-soft text-primary shadow-sm dark:bg-primary/15 dark:text-primary-muted'
            : 'text-muted hover:bg-surface-low hover:text-primary dark:text-dark-muted dark:hover:bg-dark-surface'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="flex h-full flex-col overflow-y-auto border-r border-surface-border bg-surface-low py-4 dark:border-dark-border dark:bg-dark-surface">
      <div className="px-4 pb-5">
        <Link
          to="/admin/resources/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft hover:bg-[#256fd1]"
        >
          <SquarePen className="h-4 w-4" />
          Yeni Test
        </Link>
      </div>

      <nav className="space-y-1">
        {mainLinks.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <div className="px-6 pt-4 text-xs font-bold uppercase text-outline dark:text-dark-muted">Kategoriler</div>
        {categories.map((category) => (
          <SidebarLink
            key={category.id}
            item={{
              to: `/admin/resources/${category.id}`,
              label: category.name,
              icon: categoryIcons[category.id],
            }}
            onNavigate={onNavigate}
          />
        ))}
        <div className="px-6 pt-4 text-xs font-bold uppercase text-outline dark:text-dark-muted">Yönetim</div>
        {bottomLinks.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}
