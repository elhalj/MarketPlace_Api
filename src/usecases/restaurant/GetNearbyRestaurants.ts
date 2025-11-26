import { Restaurant } from '@domain/entities/Restaurant';
import { IRestaurantRepository } from '@domain/repositories/IRestaurantRepository';
import { Location } from '@domain/value-objects/Location';

interface GetNearbyRestaurantsDTO {
  latitude: number;
  longitude: number;
  radius: number; // en kilomètres
  limit?: number;
  categories?: string[];
  minRating?: number;
}

interface GetNearbyRestaurantsResult {
  restaurants: Array<Restaurant & { distance: number }>;
  total: number;
}

export class GetNearbyRestaurants {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute(dto: GetNearbyRestaurantsDTO): Promise<GetNearbyRestaurantsResult> {
    const location = new Location(dto.latitude, dto.longitude);
    const result = await this.restaurantRepository.search({
      location,
      radius: dto.radius,
      categories: dto.categories,
      rating: dto.minRating,
      page: 1,
      limit: dto.limit || 20,
      sortBy: 'distance',
      order: 'asc'
    });

    // Le repository devrait déjà calculer les distances
    return {
      restaurants: result.restaurants as Array<Restaurant & { distance: number }>,
      total: result.total
    };
  }
}
