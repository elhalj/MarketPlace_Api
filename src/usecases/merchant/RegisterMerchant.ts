import { Merchant } from '../../domain/entities/Merchant';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Address } from '../../domain/value-objects/Address';
import { EmailService } from '../../adaptaters/services/EmailService';
import { StorageService } from '../../adaptaters/services/StorageService';
import { AuthService } from '../../adaptaters/services/AuthService';

export interface RegisterMerchantDTO {
  businessName: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    details?: string;
  };
  businessRegistrationNumber: string;
  taxId: string;
  phoneNumber: string;
  email: string;
  password: string;
  documents: {
    name: string;
    file: Buffer;
    mimeType: string;
  }[];
}

export interface RegisterMerchantResponse {
  merchant: Merchant;
  accessToken: string;
  refreshToken: string;
}

export class RegisterMerchant {
  constructor(
    private readonly merchantRepository: IMerchantRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly authService: AuthService
  ) { }

  async execute(data: RegisterMerchantDTO): Promise<RegisterMerchantResponse> {
    // Check if email already exists
    const existingMerchant = await this.merchantRepository.findByEmail(data.email);
    if (existingMerchant) {
      throw new Error('Email already registered');
    }

    // Verify business name uniqueness
    const existingBusinessName = await this.merchantRepository.findByBusinessName(data.businessName);
    if (existingBusinessName) {
      throw new Error('Business name already registered');
    }

    // Verify tax ID uniqueness
    const existingTaxId = await this.merchantRepository.existsByTaxId(data.taxId);
    if (existingTaxId) {
      throw new Error('Tax ID already registered');
    }

    // Hash password
    const hashedPassword = await this.authService.hashPassword(data.password);

    // Create business address
    const businessAddress = new Address(
      data.businessAddress.street,
      data.businessAddress.city,
      data.businessAddress.state,
      data.businessAddress.country,
      data.businessAddress.zipCode,
      data.businessAddress.details
    );

    // Create merchant ID
    const merchantId = crypto.randomUUID();

    // Upload documents
    const documentUrls = await Promise.all(
      data.documents.map(doc => {
        const fileObject = {
          buffer: doc.file,
          originalname: doc.name,
          mimetype: doc.mimeType
        } as any;
        return this.storageService.uploadFile(fileObject);
      })
    );

    // Create merchant
    const merchant = new Merchant(
      merchantId,
      data.businessName,
      businessAddress,
      data.businessRegistrationNumber,
      data.taxId,
      data.phoneNumber,
      data.email,
      hashedPassword,
      documentUrls,
      false, // isVerified (default)
      'PENDING', // status (default)
    );

    // Save merchant
    const savedMerchant = await this.merchantRepository.create(merchant);

    // Generate tokens
    const accessToken = this.authService.generateAccessToken(savedMerchant);
    const refreshToken = this.authService.generateRefreshToken(savedMerchant);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      savedMerchant.email,
      savedMerchant.businessName
    );

    return {
      merchant: savedMerchant,
      accessToken,
      refreshToken
    };

  }
}
