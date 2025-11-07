import { IProductRepository } from '../../domain/repositories/IProductRepository';

export interface UpdateProductStockDTO {
  productId: string;
  quantity: number;
}

export class UpdateProductStock {
  constructor(
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: UpdateProductStockDTO): Promise<void> {
    // Check if product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate quantity
    if (data.quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    // Update stock
    await this.productRepository.updateStock(data.productId, data.quantity);

    // Update availability based on stock
    if (data.quantity === 0) {
      await this.productRepository.updateAvailability(data.productId, false);
    } else {
      await this.productRepository.updateAvailability(data.productId, true);
    }
  }
}
