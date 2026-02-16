// ============================================================
// Shared utility functions
// ============================================================

const MEMBER_COLORS = [
  'bg-lime-400',
  'bg-cyan-400',
  'bg-pink-500',
  'bg-amber-400',
  'bg-purple-500',
];

/**
 * Get a consistent color class for a user based on their index or userId.
 * When index is provided, uses direct modulo. Otherwise hashes the userId.
 */
export function getUserColor(index?: number, userId?: string): string {
  if (index !== undefined) {
    return MEMBER_COLORS[index % MEMBER_COLORS.length];
  }
  if (userId) {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MEMBER_COLORS[hash % MEMBER_COLORS.length];
  }
  return MEMBER_COLORS[0];
}

/**
 * Format an ISO date string to short date (e.g., "Feb 15")
 */
export function formatDateShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp to HH:MM (24h)
 */
export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
