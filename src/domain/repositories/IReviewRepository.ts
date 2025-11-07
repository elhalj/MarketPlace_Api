import { Review } from '../entities/Review';

export interface IReviewRepository {
  // Create
  create(review: Review): Promise<Review>;
  
  // Read
  findById(id: string): Promise<Review | null>;
  findByOrderId(orderId: string): Promise<Review | null>;
  findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ reviews: Review[]; total: number }>;
  findByRestaurantId(
    restaurantId: string,
    page: number,
    limit: number
  ): Promise<{ reviews: Review[]; total: number }>;
  
  // Update
  update(id: string, review: Partial<Review>): Promise<Review>;
  verify(id: string): Promise<Review>;
  
  // Delete
  delete(id: string): Promise<void>;
  
  // Custom queries
  findByRating(
    rating: number,
    page: number,
    limit: number
  ): Promise<{ reviews: Review[]; total: number }>;
  
  countByRestaurant(restaurantId: string): Promise<number>;
  getAverageRating(restaurantId: string): Promise<number>;
  getRatingDistribution(restaurantId: string): Promise<Record<number, number>>;
}