import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/classNames';

export default function SearchCombobox({
  label,
  error,
  options = [],
  value,
  onChange,
  placeholder = 'Seçin',
  searchPlaceholder = 'Ara...',
  emptyLabel = 'Sonuç bulunamadı',
  disabled = false,
  searchable = true,
  className = '',
  panelClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selectedLabel = value || '';
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
    if (!normalizedQuery) return options;
    return options.filter((item) => item.toLocaleLowerCase('tr-TR').includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open || !searchable) return;
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, searchable]);

  function selectOption(option) {
    onChange(option);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn('relative block space-y-2', open && 'z-[120]', className)}>
      {label ? <span className="block text-sm font-semibold text-muted dark:text-dark-muted">{label}</span> : null}
      <button
        type="button"
        className={cn(
          'soft-input flex items-center justify-between gap-3 text-left transition-all duration-300',
          !selectedLabel && 'text-outline dark:text-dark-muted',
          error && 'border-danger',
          disabled && 'cursor-not-allowed opacity-70',
        )}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-outline transition-transform duration-300', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          className={cn(
            'combobox-panel absolute left-0 top-full z-50 mt-2 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-surface-border bg-white shadow-soft dark:border-dark-border dark:bg-dark-card',
            panelClassName,
          )}
        >
          {searchable ? (
            <div className="relative border-b border-surface-border p-3 dark:border-dark-border">
              <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                ref={searchRef}
                className="soft-input h-10 pl-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setOpen(false);
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}
          <div className="max-h-72 overflow-y-auto p-2" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition-all duration-200 hover:bg-primary-soft hover:text-primary dark:text-dark-muted dark:hover:bg-primary/15 dark:hover:text-primary-muted',
                    option === value && 'bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted',
                  )}
                  onClick={() => selectOption(option)}
                  role="option"
                  aria-selected={option === value}
                >
                  <span className="truncate">{option}</span>
                  {option === value ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm font-medium text-outline dark:text-dark-muted">{emptyLabel}</div>
            )}
          </div>
        </div>
      ) : null}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </div>
  );
}
