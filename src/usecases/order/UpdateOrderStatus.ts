import { Order, OrderStatus } from '../../domain/entities/Order';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { NotificationService } from '../../adaptaters/services/NotificationService';

export interface UpdateOrderStatusDTO {
  orderId: string;
  status: OrderStatus;
}

export class UpdateOrderStatus {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly notificationService: NotificationService
  ) {}

  async execute(data: UpdateOrderStatusDTO): Promise<Order> {
    // Get order
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, data.status);

    // Update order status
    const updatedOrder = await this.orderRepository.updateStatus(data.orderId, data.status);

    // Send notifications based on status
    switch (data.status) {
      case 'CONFIRMED':
        await this.notificationService.notifyOrderConfirmed(order.userId, updatedOrder);
        break;
      case 'PREPARING':
        await this.notificationService.notifyOrderPreparing(order.userId, updatedOrder);
        break;
      case 'READY':
        await this.notificationService.notifyOrderReady(order.userId, updatedOrder);
        break;
      case 'ON_DELIVERY':
        await this.notificationService.notifyOrderOnDelivery(order.userId, updatedOrder);
        break;
      case 'DELIVERED':
        await this.notificationService.notifyOrderDelivered(order.userId, updatedOrder);
        break;
      case 'CANCELLED':
        await this.notificationService.notifyOrderCancelled(order.userId, updatedOrder);
        break;
    }

    return updatedOrder;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PREPARING', 'CANCELLED'],
      'PREPARING': ['READY', 'CANCELLED'],
      'READY': ['ON_DELIVERY', 'CANCELLED'],
      'ON_DELIVERY': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [],
      'CANCELLED': []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}
