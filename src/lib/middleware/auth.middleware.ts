import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { UserService } from '@/lib/services/user.service';

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Require authentication - ensures user is logged in
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const userService = new UserService();
  const user = await userService.getUserById(session.user.id);

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User account is inactive');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Require specific role(s) - ensures user has one of the allowed roles
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }

  return user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthenticatedUser, role: UserRole): boolean {
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Check if user is an editor or admin
 */
export function canEdit(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.EDITOR;
}

/**
 * Check if user can only view (viewer role)
 */
export function isViewer(user: AuthenticatedUser): boolean {
  return user.role === UserRole.VIEWER;
}
