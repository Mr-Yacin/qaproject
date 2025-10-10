import bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { UserRepository, CreateUserInput, UpdateUserInput } from '@/lib/repositories/user.repository';

const SALT_ROUNDS = 10;

export interface AuthenticateResult {
  user: User;
  success: boolean;
}

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findActiveByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async listUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async createUser(data: Omit<CreateUserInput, 'password'> & { password: string }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async updateUser(id: string, data: UpdateUserInput & { password?: string }): Promise<User> {
    const updateData: UpdateUserInput = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    return this.userRepository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<User> {
    return this.userRepository.delete(id);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
