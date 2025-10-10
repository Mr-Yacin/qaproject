import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { UserService } from '@/lib/services/user.service';
import { UserRole } from '@prisma/client';

describe('User Management Integration Tests', () => {
  const userService = new UserService();
  let testUserId: string;

  beforeAll(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-user-',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-user-',
        },
      },
    });
  });

  describe('User Service', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test-user-create@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        role: UserRole.EDITOR,
        isActive: true,
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
      expect(user.password).not.toBe(userData.password); // Should be hashed

      testUserId = user.id;
    });

    it('should not create a user with duplicate email', async () => {
      const userData = {
        email: 'test-user-create@example.com',
        password: 'SecurePassword123!',
        name: 'Duplicate User',
        role: UserRole.VIEWER,
      };

      await expect(userService.createUser(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should authenticate user with correct credentials', async () => {
      const user = await userService.authenticateUser(
        'test-user-create@example.com',
        'SecurePassword123!'
      );

      expect(user).toBeDefined();
      expect(user?.email).toBe('test-user-create@example.com');
    });

    it('should not authenticate user with incorrect password', async () => {
      const user = await userService.authenticateUser(
        'test-user-create@example.com',
        'WrongPassword'
      );

      expect(user).toBeNull();
    });

    it('should not authenticate inactive user', async () => {
      // Deactivate the user
      await userService.updateUser(testUserId, { isActive: false });

      const user = await userService.authenticateUser(
        'test-user-create@example.com',
        'SecurePassword123!'
      );

      expect(user).toBeNull();

      // Reactivate for other tests
      await userService.updateUser(testUserId, { isActive: true });
    });

    it('should list all users', async () => {
      const users = await userService.listUsers();

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should get user by id', async () => {
      const user = await userService.getUserById(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('test-user-create@example.com');
    });

    it('should get user by email', async () => {
      const user = await userService.getUserByEmail('test-user-create@example.com');

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });

    it('should update user', async () => {
      const updatedUser = await userService.updateUser(testUserId, {
        name: 'Updated Test User',
        role: UserRole.ADMIN,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser.name).toBe('Updated Test User');
      expect(updatedUser.role).toBe(UserRole.ADMIN);
    });

    it('should update user password', async () => {
      const updatedUser = await userService.updateUser(testUserId, {
        password: 'NewSecurePassword456!',
      });

      expect(updatedUser).toBeDefined();

      // Verify new password works
      const authenticatedUser = await userService.authenticateUser(
        'test-user-create@example.com',
        'NewSecurePassword456!'
      );

      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.id).toBe(testUserId);
    });

    it('should not update user with duplicate email', async () => {
      // Create another user
      const anotherUser = await userService.createUser({
        email: 'test-user-another@example.com',
        password: 'Password123!',
        name: 'Another User',
        role: UserRole.VIEWER,
      });

      // Try to update first user with second user's email
      await expect(
        userService.updateUser(testUserId, {
          email: 'test-user-another@example.com',
        })
      ).rejects.toThrow('User with this email already exists');

      // Clean up
      await userService.deleteUser(anotherUser.id);
    });

    it('should delete user', async () => {
      const deletedUser = await userService.deleteUser(testUserId);

      expect(deletedUser).toBeDefined();
      expect(deletedUser.id).toBe(testUserId);

      // Verify user is deleted
      const user = await userService.getUserById(testUserId);
      expect(user).toBeNull();
    });
  });
});
