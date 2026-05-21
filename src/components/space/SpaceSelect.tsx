import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SpaceSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

export function SpaceSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  searchable,
}: SpaceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [flipUp, setFlipUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  // Auto-enable search when >8 options
  const showSearch = searchable ?? options.length > 8;

  // Filter options by query
  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setQuery('');
  }, [open, showSearch]);

  // Flip detection: open upward if not enough space below
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setFlipUp(spaceBelow < 260);
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-left focus:outline-none focus:border-stone-500 transition-colors"
      >
        <span className={selected ? 'text-stone-800' : 'text-stone-400'}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={14} className={`text-stone-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-[9999] left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden ${
            flipUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {/* Search */}
          {showSearch && (
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-stone-400 text-center">Sin resultados</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    opt.value === value
                      ? 'bg-[var(--accent-light)] text-[var(--accent)] font-medium'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
