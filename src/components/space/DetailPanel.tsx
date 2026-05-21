import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './tokens';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Detail sidebar panel — fixed on the right side of the screen.
 * Desktop (>=768px): slides in from right, fixed position, no overlay.
 * Mobile (<768px): full-screen overlay with backdrop.
 */
export function DetailPanel({ open, onClose, title, children, footer }: DetailPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll on mobile overlay
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open, isMobile]);

  if (!open) return null;

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 shrink-0 bg-white">
        <h2 className="text-stone-900 text-lg font-bold">{title}</h2>
        <button onClick={onClose} className={cx.btnIcon}><X size={18} /></button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {children}
      </div>
      {/* Footer */}
      {footer && (
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-stone-200 shrink-0 bg-white">
          {footer}
        </div>
      )}
    </>
  );

  // ── Mobile: full-screen overlay ──
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0" style={{ zIndex: 99999 }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative h-full ml-auto w-full max-w-md bg-white flex flex-col shadow-2xl">
          {panelContent}
        </div>
      </div>,
      document.body,
    );
  }

  // ── Desktop: fixed sidebar from the right ──
  // Positioned below the header (h-14 = 56px), beside the nav sidebar
  return createPortal(
    <div
      className="fixed top-14 right-0 bottom-0 w-[420px] bg-white border-l border-stone-200 flex flex-col shadow-lg"
      style={{ zIndex: 50 }}
    >
      {panelContent}
    </div>,
    document.body,
  );
}
