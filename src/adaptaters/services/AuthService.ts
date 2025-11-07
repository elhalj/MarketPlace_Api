import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { EmailService } from './EmailService';
import { tokens, TokenPayload } from '../../infrastructure/config/jwt';
import { IUser } from '../../domain/entities/User';
import { Merchant } from '../../domain/entities/Merchant';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';

export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly merchantRepository: IMerchantRepository
  ) {}

  generateAccessToken(user: IUser | Merchant): string {
    return tokens.generateAccess(user);
  }

  generateRefreshToken(user: IUser | Merchant): string {
    return tokens.generateRefresh(user);
  }

  refreshAccessToken(refreshToken: string): string {
    const decoded = tokens.verify<TokenPayload>(refreshToken);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Create a minimal user object for token generation
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return tokens.generateAccess(user as IUser);
  }

  verifyToken(token: string): TokenPayload {
    return tokens.verify<TokenPayload>(token);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generateResetToken(userId: string): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, 10);
    
    // Store the hash in Redis or database with expiry
    // await this.storeResetToken(userId, hash);

    return resetToken;
  }

  async verifyResetToken(token: string): Promise<string> {
    // Implement token verification logic
    // This should check against stored hash in Redis or database
    // For now, returning a mock userId
    if (!token) throw new Error('Invalid token');
    return 'mock-user-id';
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    await this.emailService.sendPasswordResetEmail(email, token);
  }

  async verifyMerchantCredentials(email: string, password: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findByEmail(email);
    if (!merchant) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.verifyPassword(password, merchant.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return merchant;
  }

  async refreshMerchantTokens(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const decoded = this.verifyToken(refreshToken);
    if (decoded.type !== 'refresh' || decoded.role !== 'merchant') {
      throw new Error('Invalid token type');
    }

    const merchant = await this.merchantRepository.findById(decoded.id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const accessToken = this.generateAccessToken(merchant);
    const newRefreshToken = this.generateRefreshToken(merchant);

    return { accessToken, newRefreshToken };
  }
}
