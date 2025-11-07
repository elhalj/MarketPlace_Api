import { Merchant } from '../../domain/entities/Merchant';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import { Address } from '../../domain/value-objects/Address';
import { StorageService } from '../../adaptaters/services/StorageService';

export interface UpdateMerchantProfileDTO {
  businessName?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    details?: string;
  };
  phoneNumber?: string;
  email?: string;
  documents?: {
    name: string;
    file: Buffer;
    mimeType: string;
  }[];
  removeDocuments?: string[]; // URLs of documents to remove
}

export class UpdateMerchantProfile {
  constructor(
    private readonly merchantRepository: IMerchantRepository,
    private readonly storageService: StorageService
  ) {}

  async execute(merchantId: string, data: UpdateMerchantProfileDTO): Promise<Merchant> {
    // Check if merchant exists
    const existingMerchant = await this.merchantRepository.findById(merchantId);
    if (!existingMerchant) {
      throw new Error('Merchant not found');
    }

    // Prepare update data
    const updateData: Partial<Merchant> = {};

    // Handle business name update
    if (data.businessName && data.businessName !== existingMerchant.businessName) {
      const existingName = await this.merchantRepository.findByBusinessName(data.businessName);
      if (existingName) {
        throw new Error('Business name already in use');
      }
      updateData.businessName = data.businessName;
    }

    // Handle address update
    if (data.businessAddress) {
      const address = new Address(
        data.businessAddress.street,
        data.businessAddress.city,
        data.businessAddress.state,
        data.businessAddress.country,
        data.businessAddress.zipCode,
        data.businessAddress.details
      );
      updateData.businessAddress = address;
    }

    // Handle contact info updates
    if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
    if (data.email) updateData.email = data.email;

    // Handle document updates
    if (data.documents) {
      const newDocumentUrls = await Promise.all(
        data.documents.map(doc =>
          this.storageService.uploadMerchantDocument(
            merchantId,
            doc.file,
            doc.name,
            doc.mimeType
          )
        )
      );

      // Combine existing and new documents
      const currentDocs = existingMerchant.documentsUrls.filter(
        url => !data.removeDocuments?.includes(url)
      );
      updateData.documentsUrls = [...currentDocs, ...newDocumentUrls];
    } else if (data.removeDocuments) {
      // Only remove documents
      updateData.documentsUrls = existingMerchant.documentsUrls.filter(
        url => !data.removeDocuments.includes(url)
      );
    }

    // Delete removed documents from storage
    if (data.removeDocuments) {
      await Promise.all(
        data.removeDocuments.map(url =>
          this.storageService.deleteFile(url)
        )
      );
    }

    // Update merchant
    const updatedMerchant = await this.merchantRepository.update(merchantId, updateData);
    if (!updatedMerchant) {
      throw new Error('Failed to update merchant profile');
    }

    return updatedMerchant;
  }
}
