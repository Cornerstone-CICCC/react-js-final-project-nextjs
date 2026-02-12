import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="w-16 h-16 text-white/20" />
      </div>
      <div className="text-white/40 font-light mb-2">{title}</div>
      {description && (
        <p className="text-white/30 text-sm font-light mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-12 px-8 bg-white text-black rounded-full hover:bg-white/90 transition-all text-sm font-medium tracking-wide"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
