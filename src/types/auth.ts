export const USER_ROLES = {
  USER: 'USER',
  SURVEYOR: 'SURVEYOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface AuthUser {
  userId: string;
  role: UserRole;
}
