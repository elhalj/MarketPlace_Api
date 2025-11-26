
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailService } from '../../adaptaters/services/EmailService';
import User from '@domain/entities/User';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
export interface RegisterUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'merchant' | 'admin';
  isVerified: boolean;
  isActive: boolean;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(data: RegisterUserDTO): Promise<User> {
    // Validate email uniqueness
    const existingUserByEmail = await this.userRepository.existsByEmail(data.email);
    if (existingUserByEmail) {
      throw new Error('Email already registered');
    }

    // Validate phone uniqueness
    const existingUserByPhone = await this.userRepository.existsByPhone(data.phone);
    if (existingUserByPhone) {
      throw new Error('Phone number already registered');
    }

    const hashPassword = await bcrypt.hash(data.password, 12)
    // Create new user
    const user = new User(
      data.firstName,
      data.lastName,
      data.email,
      hashPassword, // Note: Password should be hashed before storage
      data.role,
      data.isVerified,
      data.isActive,
      crypto.randomUUID()
    );

    // Save user
    const savedUser = await this.userRepository.create(user);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return savedUser;
  }
}
