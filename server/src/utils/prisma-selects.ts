/**
 * Shared Prisma select/include definitions to avoid duplication across routes.
 */

export const USER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export const MEMBERS_INCLUDE = {
  members: { include: { user: { select: USER_SELECT } } },
} as const;

export const SCHEDULE_INCLUDE = {
  attendances: {
    include: { user: { select: USER_SELECT } },
  },
} as const;
