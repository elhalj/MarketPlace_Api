import { Restaurant } from '@domain/entities/Restaurant';
import { IRestaurantRepository } from '@domain/repositories/IRestaurantRepository';
import { Location } from '@domain/value-objects/Location';

interface SearchRestaurantDTO {
  query?: string;
  categories?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // en kilomètres
  };
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'distance' | 'name';
  order?: 'asc' | 'desc';
}

interface SearchRestaurantResult {
  restaurants: Restaurant[];
  total: number;
  page: number;
  totalPages: number;
}

export class SearchRestaurant {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute(dto: SearchRestaurantDTO): Promise<SearchRestaurantResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const location = dto.location 
      ? new Location(dto.location.latitude, dto.location.longitude)
      : undefined;

    // Utiliser les critères de recherche fournis
    const result = await this.restaurantRepository.search({
      query: dto.query,
      categories: dto.categories,
      location: location,
      radius: dto.location?.radius,
      rating: dto.rating,
      page,
      limit,
      sortBy: dto.sortBy,
      order: dto.order
    });

    return {
      restaurants: result.restaurants,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }
}
