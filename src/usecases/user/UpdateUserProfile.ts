
import User from '@domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface UpdateUserProfileDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export class UpdateUserProfile {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string, data: UpdateUserProfileDTO): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate phone uniqueness if it's being updated
    if (data.phone) {
      const existingUserByPhone = await this.userRepository.existsByPhone(data.phone);
      if (existingUserByPhone) {
        throw new Error('Phone number already in use');
      }
    }

    // Update user
    const updatedUser = await this.userRepository.update(userId, data);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }
}
