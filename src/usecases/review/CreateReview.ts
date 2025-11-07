import { Review } from '../../domain/entities/Review';
import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { NotificationService } from '../../adaptaters/services/NotificationService';

export interface CreateReviewDTO {
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  images?: string[];
}

export class CreateReview {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly notificationService: NotificationService
  ) {}

  async execute(data: CreateReviewDTO): Promise<Review> {
    // Verify order exists and is delivered
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'DELIVERED') {
      throw new Error('Can only review delivered orders');
    }

    // Verify user owns the order
    if (order.userId !== data.userId) {
      throw new Error('User can only review their own orders');
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findByOrderId(data.orderId);
    if (existingReview) {
      throw new Error('Order already reviewed');
    }

    // Create review
    const review = new Review(
      crypto.randomUUID(),
      data.userId,
      order.restaurantId,
      data.orderId,
      data.rating,
      data.comment,
      data.images || []
    );

    // Save review
    const savedReview = await this.reviewRepository.create(review);

    // Update restaurant rating
    await this.restaurantRepository.updateRating(order.restaurantId, data.rating);

    // Notify restaurant about new review
    await this.notificationService.notifyNewReview(
      order.restaurantId,
      savedReview
    );

    return savedReview;
  }
}
