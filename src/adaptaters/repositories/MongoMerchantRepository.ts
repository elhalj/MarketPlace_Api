import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import { Merchant } from '../../domain/entities/Merchant';
import mongoose from 'mongoose';
import { Address } from '../../domain/value-objects/Address';

const MerchantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  businessName: { type: String, required: true },
  businessAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  businessRegistrationNumber: { type: String, required: true },
  taxId: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  documentsUrls: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

const MerchantModel = mongoose.model('Merchant', MerchantSchema);

export class MongoMerchantRepository implements IMerchantRepository {
  async create(merchant: Merchant): Promise<Merchant> {
    const newMerchant = await MerchantModel.create(merchant);
    return this.mapToEntity(newMerchant);
  }

  async findById(id: string): Promise<Merchant | null> {
    const merchant = await MerchantModel.findById(id);
    return merchant ? this.mapToEntity(merchant) : null;
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    const merchant = await MerchantModel.findOne({ email });
    return merchant ? this.mapToEntity(merchant) : null;
  }

  async findByUserId(userId: string): Promise<Merchant | null> {
    const merchant = await MerchantModel.findOne({ userId });
    return merchant ? this.mapToEntity(merchant) : null;
  }

  async findByBusinessName(businessName: string): Promise<Merchant | null> {
    const merchant = await MerchantModel.findOne({ businessName });
    return merchant ? this.mapToEntity(merchant) : null;
  }

  async findAll(page: number, limit: number): Promise<{ merchants: Merchant[]; total: number }> {
    const skip = (page - 1) * limit;
    const [merchants, total] = await Promise.all([
      MerchantModel.find().skip(skip).limit(limit),
      MerchantModel.countDocuments()
    ]);
    return {
      merchants: merchants.map(merchant => this.mapToEntity(merchant)),
      total
    };
  }

  async update(id: string, merchant: Partial<Merchant>): Promise<Merchant> {
    const updatedMerchant = await MerchantModel.findByIdAndUpdate(
      id,
      { $set: merchant },
      { new: true }
    );
    if (!updatedMerchant) {
      throw new Error('Merchant not found');
    }
    return this.mapToEntity(updatedMerchant);
  }

  async updateStatus(id: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'): Promise<Merchant> {
    const updatedMerchant = await MerchantModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updatedMerchant) {
      throw new Error('Merchant not found');
    }
    return this.mapToEntity(updatedMerchant);
  }

  async delete(id: string): Promise<void> {
    await MerchantModel.findByIdAndDelete(id);
  }

  async searchMerchants(
    query: string,
    page: number,
    limit: number
  ): Promise<{ merchants: Merchant[]; total: number }> {
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query, 'i');
    const filter = {
      $or: [
        { businessName: searchRegex },
        { description: searchRegex }
      ]
    };
    const [merchants, total] = await Promise.all([
      MerchantModel.find(filter).skip(skip).limit(limit),
      MerchantModel.countDocuments(filter)
    ]);
    return {
      merchants: merchants.map(merchant => this.mapToEntity(merchant)),
      total
    };
  }

  async findByStatus(
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED',
    page: number,
    limit: number
  ): Promise<{ merchants: Merchant[]; total: number }> {
    const skip = (page - 1) * limit;
    const [merchants, total] = await Promise.all([
      MerchantModel.find({ status }).skip(skip).limit(limit),
      MerchantModel.countDocuments({ status })
    ]);
    return {
      merchants: merchants.map(merchant => this.mapToEntity(merchant)),
      total
    };
  }

  async findByFilters(filters: {
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    isVerified?: boolean;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ merchants: Merchant[]; total: number }> {
    const { status, isVerified, startDate, endDate, page, limit } = filters;
    const skip = (page - 1) * limit;
    
    const queryFilter: any = {};
    if (status) queryFilter.status = status;
    if (isVerified !== undefined) queryFilter.isVerified = isVerified;
    if (startDate || endDate) {
      queryFilter.createdAt = {};
      if (startDate) queryFilter.createdAt.$gte = startDate;
      if (endDate) queryFilter.createdAt.$lte = endDate;
    }

    const [merchants, total] = await Promise.all([
      MerchantModel.find(queryFilter).skip(skip).limit(limit),
      MerchantModel.countDocuments(queryFilter)
    ]);
    return {
      merchants: merchants.map(merchant => this.mapToEntity(merchant)),
      total
    };
  }

  async countMerchants(): Promise<number> {
    return MerchantModel.countDocuments();
  }

  async countByStatus(status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'): Promise<number> {
    return MerchantModel.countDocuments({ status });
  }

  async verifyMerchant(id: string): Promise<void> {
    const merchant = await MerchantModel.findByIdAndUpdate(
      id,
      { $set: { isVerified: true, status: 'ACTIVE' } }
    );
    if (!merchant) {
      throw new Error('Merchant not found');
    }
  }

  async suspendMerchant(id: string): Promise<void> {
    const merchant = await MerchantModel.findByIdAndUpdate(
      id,
      { $set: { status: 'SUSPENDED' } }
    );
    if (!merchant) {
      throw new Error('Merchant not found');
    }
  }

  async activateMerchant(id: string): Promise<void> {
    const merchant = await MerchantModel.findByIdAndUpdate(
      id,
      { $set: { status: 'ACTIVE' } }
    );
    if (!merchant) {
      throw new Error('Merchant not found');
    }
  }

  async existsByBusinessName(businessName: string): Promise<boolean> {
    const count = await MerchantModel.countDocuments({ businessName });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await MerchantModel.countDocuments({ email });
    return count > 0;
  }

  async existsByTaxId(taxId: string): Promise<boolean> {
    const count = await MerchantModel.countDocuments({ taxId });
    return count > 0;
  }

  async addDocument(id: string, documentUrl: string): Promise<void> {
    await MerchantModel.findByIdAndUpdate(
      id,
      { $addToSet: { documentsUrls: documentUrl } }
    );
  }

  async removeDocument(id: string, documentUrl: string): Promise<void> {
    await MerchantModel.findByIdAndUpdate(
      id,
      { $pull: { documentsUrls: documentUrl } }
    );
  }

  private mapToEntity(model: any): Merchant {
    const address = new Address(
      model.businessAddress.street,
      model.businessAddress.city,
      model.businessAddress.state,
      model.businessAddress.country,
      model.businessAddress.postalCode
    );

    return new Merchant(
      model._id.toString(),
      model.userId,
      model.businessName,
      address,
      model.businessRegistrationNumber,
      model.taxId,
      model.phoneNumber,
      model.email,
      model.documentsUrls,
      model.isVerified,
      model.status,
      model.createdAt,
      model.updatedAt
    );
  }
}
