import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailService } from '../../adaptaters/services/EmailService';

export interface RegisterUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
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

    // Create new user
    const user = new User(
      crypto.randomUUID(),
      data.firstName,
      data.lastName,
      data.email,
      data.password, // Note: Password should be hashed before storage
      data.phone
    );

    // Save user
    const savedUser = await this.userRepository.create(user);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return savedUser;
  }
}
