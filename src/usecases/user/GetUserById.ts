import User from '@domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class GetUserById {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
