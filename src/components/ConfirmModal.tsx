import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmLabel = '삭제하기',
  cancelLabel = '취소',
  isDestructive = true,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 border border-transparent hover:border-black text-slate-500 hover:text-black transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-lg font-black text-black leading-tight">{title}</h3>
            <p className="text-sm font-bold text-slate-700 leading-snug">{message}</p>
            {subMessage && (
              <p className="text-xs text-slate-500 font-medium pt-1">{subMessage}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-black/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 text-xs font-black text-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition ${
              isDestructive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[#FF6B00] hover:bg-[#E05E00]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
