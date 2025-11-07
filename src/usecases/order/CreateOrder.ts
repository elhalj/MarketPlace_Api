import { Order, OrderItem } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Address } from '../../domain/value-objects/Address';
import { Price } from '../../domain/value-objects/Price';
import { NotificationService } from '../../adaptaters/services/NotificationService';

export interface CreateOrderDTO {
  userId: string;
  restaurantId: string;
  items: {
    productId: string;
    quantity: number;
    notes?: string;
  }[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    details?: string;
  };
  paymentMethod: string;
  notes?: string;
}

export class CreateOrder {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly notificationService: NotificationService
  ) {}

  async execute(data: CreateOrderDTO): Promise<Order> {
    // Verify restaurant exists and is active
    const restaurant = await this.restaurantRepository.findById(data.restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    if (!restaurant.isActive) {
      throw new Error('Restaurant is not currently active');
    }

    // Validate and process order items
    const orderItems: OrderItem[] = [];
    let totalPrice = new Price(0, 'USD'); // Default currency, should be configurable

    for (const item of data.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (!product.available) {
        throw new Error(`Product ${product.name} is not available`);
      }

      // Calculate item total
      const itemTotal = product.price.multiply(item.quantity);
      totalPrice = totalPrice.add(itemTotal);

      orderItems.push({
        product,
        quantity: item.quantity,
        notes: item.notes
      });
    }

    // Create delivery address
    const deliveryAddress = new Address(
      data.deliveryAddress.street,
      data.deliveryAddress.city,
      data.deliveryAddress.state,
      data.deliveryAddress.country,
      data.deliveryAddress.zipCode,
      data.deliveryAddress.details
    );

    // Create order
    const order = new Order(
      crypto.randomUUID(),
      data.userId,
      data.restaurantId,
      orderItems,
      totalPrice,
      deliveryAddress,
      'PENDING',
      undefined,
      undefined,
      'PENDING',
      data.paymentMethod,
      data.notes
    );

    // Save order
    const savedOrder = await this.orderRepository.create(order);

    // Notify restaurant
    await this.notificationService.notifyNewOrder(savedOrder);

    // Notify customer
    await this.notificationService.notifyOrderCreated(data.userId, savedOrder);

    return savedOrder;
  }
}
