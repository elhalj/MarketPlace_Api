import { Order } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface GetUserOrderDTO {
  userId: string;
  status?: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  page: number;
  limit: number;
}

export interface GetUserOrderResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetUserOrder {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(params: GetUserOrderDTO): Promise<GetUserOrderResponse> {
    // Verify user exists
    const user = await this.userRepository.findById(params.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get orders
    const { orders, total } = await this.orderRepository.findByFilters({
      userId: params.userId,
      status: params.status,
      page: params.page,
      limit: params.limit
    });

    const totalPages = Math.ceil(total / params.limit);

    return {
      orders,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  }
}
