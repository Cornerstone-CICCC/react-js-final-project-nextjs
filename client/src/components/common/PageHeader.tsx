import type { ReactNode } from 'react';

interface PageHeaderProps {
  label: string;
  value: string | number;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ label, value, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="text-xs tracking-widest text-white/40 font-light mb-2">
          {label}
        </div>
        <div className="text-4xl font-light text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-white/30 mt-2">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
