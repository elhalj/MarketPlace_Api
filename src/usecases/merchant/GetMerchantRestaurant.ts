import { Restaurant } from '../../domain/entities/Restaurant';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';

export interface GetMerchantRestaurantDTO {
  merchantId: string;
  page: number;
  limit: number;
}

export interface GetMerchantRestaurantResponse {
  restaurants: Restaurant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statistics: {
    totalOrders: number;
    averageRating: number;
    totalRevenue: number;
    activeRestaurants: number;
  };
}

export class GetMerchantRestaurant {
  constructor(
    private readonly merchantRepository: IMerchantRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(params: GetMerchantRestaurantDTO): Promise<GetMerchantRestaurantResponse> {
    // Verify merchant exists
    const merchant = await this.merchantRepository.findById(params.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get restaurants
    const { restaurants, total } = await this.restaurantRepository.findByMerchantId(
      params.merchantId,
      params.page,
      params.limit
    );

    // Calculate statistics
    const allRestaurants = await this.restaurantRepository.findByMerchantId(
      params.merchantId,
      1,
      1000
    );

    let totalRating = 0;
    let activeCount = 0;

    allRestaurants.restaurants.forEach(restaurant => {
      if (restaurant.isActive) activeCount++;
      totalRating += restaurant.rating;
    });

    const averageRating = allRestaurants.restaurants.length > 0
      ? totalRating / allRestaurants.restaurants.length
      : 0;

    const totalPages = Math.ceil(total / params.limit);

    return {
      restaurants,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      statistics: {
        totalOrders: 0, // To be implemented with OrderRepository
        averageRating,
        totalRevenue: 0, // To be implemented with OrderRepository
        activeRestaurants: activeCount
      }
    };
  }
}
