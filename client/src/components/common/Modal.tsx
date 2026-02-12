import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "SAVE",
  submitDisabled = false,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-light tracking-tight text-white mb-6">
          {title}
        </h2>

        {children}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all font-medium text-sm tracking-wide"
          >
            CANCEL
          </button>
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="flex-1 h-12 bg-white text-black rounded-2xl hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm tracking-wide"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
