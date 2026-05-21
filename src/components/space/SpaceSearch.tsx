import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cx } from './tokens';

interface SpaceSearchProps {
  /** Fires after 300ms debounce with the cleaned value */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Initial value (e.g. from sessionStorage) */
  defaultValue?: string;
  /** Show spinner inside input */
  loading?: boolean;
  className?: string;
}

export function SpaceSearch({
  onChange,
  placeholder = 'Buscar...',
  defaultValue = '',
  loading = false,
  className = '',
}: SpaceSearchProps) {
  const [input, setInput] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current(input);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`relative flex-1 max-w-sm ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        className={cx.input + ' pl-9 pr-9'}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {loading ? (
          <Loader2 size={14} className="animate-spin text-stone-400" />
        ) : input ? (
          <button
            onClick={handleClear}
            className="p-0.5 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Limpiar busqueda"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="hidden sm:inline text-[10px] text-stone-300 font-mono">⌘K</kbd>
        )}
      </div>
    </div>
  );
}
