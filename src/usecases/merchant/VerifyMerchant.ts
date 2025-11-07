import { Merchant } from '../../domain/entities/Merchant';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import { EmailService } from '../../adaptaters/services/EmailService';
import { NotificationService } from '../../adaptaters/services/NotificationService';

export class VerifyMerchant {
  constructor(
    private readonly merchantRepository: IMerchantRepository,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) {}

  async execute(merchantId: string): Promise<Merchant> {
    // Get merchant
    const merchant = await this.merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Check if already verified
    if (merchant.isVerified) {
      throw new Error('Merchant is already verified');
    }

    // Verify merchant
    await this.merchantRepository.verifyMerchant(merchantId);
    const verifiedMerchant = await this.merchantRepository.findById(merchantId);
    
    if (!verifiedMerchant) {
      throw new Error('Failed to verify merchant');
    }

    // Send verification email
    await this.emailService.sendWelcomeEmail(
      verifiedMerchant.email,
      verifiedMerchant.businessName
    );

    // Send notification
    await this.notificationService.notifyMerchantVerified(verifiedMerchant);

    return verifiedMerchant;
  }
}
