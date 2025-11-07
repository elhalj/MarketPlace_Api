import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AuthService } from '../../adaptaters/services/AuthService';

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  newRefreshToken: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService
  ) {}

  async execute(data: LoginUserDTO): Promise<LoginResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.authService.verifyPassword(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate both access and refresh tokens
    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // Verify and generate new tokens
    const accessToken = this.authService.refreshAccessToken(refreshToken);
    const newRefreshToken = this.authService.generateRefreshToken({
      id: this.authService.verifyToken(refreshToken).id,
      email: this.authService.verifyToken(refreshToken).email,
      role: this.authService.verifyToken(refreshToken).role,
    } as User);

    return {
      accessToken,
      newRefreshToken
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.id) {
      throw new Error('Invalid user data');
    }

    const resetToken = await this.authService.generateResetToken(user.id);
    await this.authService.sendResetPasswordEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.authService.verifyResetToken(token);
    if (!userId) {
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await this.authService.hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }
}
