import { Order, OrderStatus } from '../entities/Order';

export interface IOrderRepository {
  // Create
  create(order: Order): Promise<Order>;
  
  // Read
  findById(id: string): Promise<Order | null>;
  findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }>;
  
  findByRestaurantId(
    restaurantId: string,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }>;
  
  findAll(page: number, limit: number): Promise<{ orders: Order[]; total: number }>;
  
  // Update
  update(id: string, order: Partial<Order>): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(id: string, status: 'PENDING' | 'PAID' | 'FAILED'): Promise<Order>;
  
  // Delete
  delete(id: string): Promise<void>;
  
  // Custom queries
  findByStatus(
    status: OrderStatus,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }>;
  
  findByDateRange(
    startDate: Date,
    endDate: Date,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }>;
  
  findByFilters(filters: {
    userId?: string;
    restaurantId?: string;
    status?: OrderStatus;
    paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ orders: Order[]; total: number }>;
  
  countOrders(): Promise<number>;
  countByUser(userId: string): Promise<number>;
  countByRestaurant(restaurantId: string): Promise<number>;
  countByStatus(status: OrderStatus): Promise<number>;
  
  calculateTotalRevenue(restaurantId: string, startDate: Date, endDate: Date): Promise<number>;
  getAverageOrderValue(restaurantId: string): Promise<number>;
  
  cancelOrder(id: string): Promise<void>;
  confirmOrder(id: string): Promise<void>;
}
