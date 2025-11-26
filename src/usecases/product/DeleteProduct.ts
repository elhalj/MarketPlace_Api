import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { OrderStatus } from '../../domain/entities/Order';

interface DeleteProductDTO {
  productId: string;
  merchantId: string; // Pour la vérification d'autorisation
}

export class DeleteProduct {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(dto: DeleteProductDTO): Promise<void> {
    // Check if product exists
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Verify merchant owns the restaurant that owns this product
    const restaurant = await this.restaurantRepository.findById(product.restaurantId);
    if (!restaurant || restaurant.merchantId !== dto.merchantId) {
      throw new Error('Not authorized to delete this product');
    }

        // Check if product has any active orders
    const orders = await this.orderRepository.findByRestaurantId(product.restaurantId, 1, 1000);
    const hasActiveOrders = orders.orders.some(order => 
      order.items.some(item => item.product.id === dto.productId) &&
      ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)
    );

    if (hasActiveOrders) {
      throw new Error('Cannot delete product with active orders');
    }

    // Delete product
    await this.productRepository.delete(dto.productId);
  }
}
