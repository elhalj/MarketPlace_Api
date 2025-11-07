import { Order } from '../../domain/entities/Order';
import { Review } from '../../domain/entities/Review';
import { EmailService } from './EmailService';
import { Merchant } from '../../domain/entities/Merchant';

export class NotificationService {
  constructor(
    private readonly emailService: EmailService
  ) {}

  async notifyNewOrder(order: Order, merchantEmail: string): Promise<void> {
    const subject = `New Order Received - ${order.id}`;
    const template = this.getNewOrderTemplate(order);
    await this.emailService.sendEmail(merchantEmail, subject, template);
  }

  async notifyOrderCreated(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderConfirmationEmail(userEmail, order.id);
  }

  async notifyOrderConfirmed(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderStatusUpdateEmail(userEmail, order.id, 'CONFIRMED');
  }

  async notifyOrderPreparing(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderStatusUpdateEmail(userEmail, order.id, 'PREPARING');
  }

  async notifyOrderReady(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderStatusUpdateEmail(userEmail, order.id, 'READY');
  }

  async notifyOrderOnDelivery(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderStatusUpdateEmail(userEmail, order.id, 'ON_DELIVERY');
  }

  async notifyOrderDelivered(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderStatusUpdateEmail(userEmail, order.id, 'DELIVERED');
  }

  async notifyOrderCancelled(userEmail: string, order: Order): Promise<void> {
    await this.emailService.sendOrderStatusUpdateEmail(userEmail, order.id, 'CANCELLED');
  }

  async notifyNewReview(restaurantEmail: string, review: Review): Promise<void> {
    const subject = 'New Review Received';
    const template = this.getNewReviewTemplate(review);
    await this.emailService.sendEmail(restaurantEmail, subject, template);
  }

  async notifyMerchantVerified(merchant: Merchant): Promise<void> {
    const subject = 'Merchant Verification Status';
    const template = this.getMerchantVerificationTemplate(merchant);
    await this.emailService.sendEmail(merchant.email, subject, template);
  }

  private getNewOrderTemplate(order: Order): string {
    const itemsList = order.items
      .map(item => `${item.quantity}x ${item.product.name} - $${item.product.price.amount.toFixed(2)}`)
      .join('\n');

    return `
      Dear Merchant,

      You have received a new order!

      Order ID: ${order.id}
      
      Order Items:
      ${itemsList}

      Total Amount: $${order.totalPrice.amount.toFixed(2)}

      Please confirm this order as soon as possible.

      Best regards,
      The Marketplace Team
    `;
  }

  private getNewReviewTemplate(review: Review): string {
    return `
      Dear Restaurant Owner,

      You have received a new review!

      Rating: ${review.rating}/5
      Comment: ${review.comment}

      Keep up the great work!

      Best regards,
      The Marketplace Team
    `;
  }

  private getMerchantVerificationTemplate(merchant: Merchant): string {
    const message = merchant.isVerified
      ? `Congratulations! Your merchant account has been successfully verified. You can now start receiving orders through our platform.`
      : `We regret to inform you that your merchant verification was not successful at this time. Our team will contact you with more details about the verification process.`;

    return `
      Dear ${merchant.businessName},

      ${message}

      If you have any questions, please contact our support team.

      Best regards,
      The Marketplace Team
    `;
  }
}
