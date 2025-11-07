import { Merchant } from '../entities/Merchant';

export interface IMerchantRepository {
  // Create
  create(merchant: Merchant): Promise<Merchant>;
  
  // Read
  findById(id: string): Promise<Merchant | null>;
  findByEmail(email: string): Promise<Merchant | null>;
  findByUserId(userId: string): Promise<Merchant | null>;
  findByBusinessName(businessName: string): Promise<Merchant | null>;
  findAll(page: number, limit: number): Promise<{ merchants: Merchant[]; total: number }>;
  
  // Update
  update(id: string, merchant: Partial<Merchant>): Promise<Merchant>;
  updateStatus(id: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'): Promise<Merchant>;
  
  // Delete
  delete(id: string): Promise<void>;
  
  // Custom queries
  searchMerchants(
    query: string,
    page: number,
    limit: number
  ): Promise<{ merchants: Merchant[]; total: number }>;
  
  findByStatus(
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED',
    page: number,
    limit: number
  ): Promise<{ merchants: Merchant[]; total: number }>;
  
  findByFilters(filters: {
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    isVerified?: boolean;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ merchants: Merchant[]; total: number }>;
  
  countMerchants(): Promise<number>;
  countByStatus(status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'): Promise<number>;
  
  verifyMerchant(id: string): Promise<void>;
  suspendMerchant(id: string): Promise<void>;
  activateMerchant(id: string): Promise<void>;
  
  existsByBusinessName(businessName: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsByTaxId(taxId: string): Promise<boolean>;
  
  addDocument(id: string, documentUrl: string): Promise<void>;
  removeDocument(id: string, documentUrl: string): Promise<void>;
}
