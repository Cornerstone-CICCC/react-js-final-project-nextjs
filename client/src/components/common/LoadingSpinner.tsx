interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = true }: LoadingSpinnerProps) {
  const containerClass = fullScreen
    ? 'flex-1 flex items-center justify-center bg-[#1a1a1a]'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        {message && (
          <p className="text-white/40 font-light tracking-wide">{message}</p>
        )}
      </div>
    </div>
  );
}
