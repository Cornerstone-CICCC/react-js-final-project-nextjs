import { getUserColor } from '../../lib/utils';

interface UserAvatarProps {
  name: string;
  index?: number;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
};

export function UserAvatar({ name, index, userId, size = 'md' }: UserAvatarProps) {
  const colorClass = getUserColor(index, userId);
  const { container, text } = sizeMap[size];

  return (
    <div
      className={`${container} ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}
    >
      <span className={`text-black font-medium ${text}`}>
        {(name || 'U')[0].toUpperCase()}
      </span>
    </div>
  );
}
