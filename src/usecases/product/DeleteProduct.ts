import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';

export class DeleteProduct {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(productId: string): Promise<void> {
    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product has active orders
    const activeOrders = await this.orderRepository.findByFilters({
      productIds: [productId],
      status: ['PENDING', 'CONFIRMED', 'PREPARING'],
      page: 1,
      limit: 1
    });

    if (activeOrders.total > 0) {
      throw new Error('Cannot delete product with active orders');
    }

    // Delete product
    await this.productRepository.delete(productId);
  }
}
