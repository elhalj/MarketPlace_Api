import { Order } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';

export interface GetMerchantOrderDTO {
  merchantId: string;
  status?: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  page: number;
  limit: number;
}

export interface GetMerchantOrderResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

export class GetMerchantOrder {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly merchantRepository: IMerchantRepository
  ) {}

  async execute(params: GetMerchantOrderDTO): Promise<GetMerchantOrderResponse> {
    // Verify merchant exists
    const merchant = await this.merchantRepository.findById(params.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get orders
    const { orders, total } = await this.orderRepository.findByFilters({
      merchantId: params.merchantId,
      status: params.status,
      page: params.page,
      limit: params.limit
    });

    // Calculate statistics
    const [totalRevenue, averageOrderValue, pendingOrders, completedOrders] = await Promise.all([
      this.orderRepository.calculateTotalRevenue(
        params.merchantId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date()
      ),
      this.orderRepository.getAverageOrderValue(params.merchantId),
      this.orderRepository.countByStatus('PENDING'),
      this.orderRepository.countByStatus('DELIVERED')
    ]);

    const totalPages = Math.ceil(total / params.limit);

    return {
      orders,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      stats: {
        totalRevenue,
        averageOrderValue,
        pendingOrders,
        completedOrders
      }
    };
  }
}
