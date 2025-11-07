import { Review } from '../../domain/entities/Review';
import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';

export interface GetRestaurantReviewDTO {
  restaurantId: string;
  rating?: number;
  page: number;
  limit: number;
}

export interface GetRestaurantReviewResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      [key: number]: number; // rating -> count
    };
  };
}

export class GetRestaurantReview {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(params: GetRestaurantReviewDTO): Promise<GetRestaurantReviewResponse> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(params.restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Get reviews
    const { reviews, total } = await this.reviewRepository.findByRestaurantId(
      params.restaurantId,
      params.page,
      params.limit
    );

    // Calculate statistics
    const allReviews = await this.reviewRepository.findByRestaurantId(
      params.restaurantId,
      1,
      1000
    );

    const ratingDistribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    let totalRating = 0;
    allReviews.reviews.forEach(review => {
      totalRating += review.rating;
      ratingDistribution[review.rating]++;
    });

    const averageRating = allReviews.reviews.length > 0
      ? totalRating / allReviews.reviews.length
      : 0;

    const totalPages = Math.ceil(total / params.limit);

    return {
      reviews,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      statistics: {
        averageRating,
        totalReviews: total,
        ratingDistribution
      }
    };
  }
}
