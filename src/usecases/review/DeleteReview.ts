import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';

export class DeleteReview {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(reviewId: string, userId: string): Promise<void> {
    // Find review
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify user owns the review
    if (review.userId !== userId) {
      throw new Error('User can only delete their own reviews');
    }

    // Delete review
    await this.reviewRepository.delete(reviewId);

    // Recalculate restaurant rating
    const restaurantReviews = await this.reviewRepository.findByRestaurantId(
      review.restaurantId,
      1,
      1000
    );

    if (restaurantReviews.reviews.length > 0) {
      const newRating = restaurantReviews.reviews.reduce(
        (acc, rev) => acc + rev.rating,
        0
      ) / restaurantReviews.reviews.length;

      await this.restaurantRepository.updateRating(review.restaurantId, newRating);
    }
  }
}