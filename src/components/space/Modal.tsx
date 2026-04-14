import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './tokens';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full-right';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    'full-right': 'max-w-md h-full ml-auto rounded-none rounded-l-2xl',
  }[size];

  const isSlidePanel = size === 'full-right';

  const content = (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-zinc-950/95"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className={`relative flex ${isSlidePanel ? 'justify-end h-full' : 'items-center justify-center p-4 min-h-full'}`}>
        <div className={`relative bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black/80 w-full ${sizeClass} ${isSlidePanel ? '' : 'rounded-2xl max-h-[90dvh]'} flex flex-col`}>
          {/* Orange top bar */}
          <div className="h-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] shrink-0 rounded-t-2xl" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-950 rounded-t-2xl">
            <h2 className="text-white text-lg font-bold">{title}</h2>
            <button onClick={onClose} className={cx.btnIcon}>
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 shrink-0 bg-zinc-950">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
