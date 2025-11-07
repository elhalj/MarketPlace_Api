import { Restaurant } from '../../domain/entities/Restaurant';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';

export class GetRestaurantById {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(id: string): Promise<Restaurant | null> {
    return this.restaurantRepository.findById(id);
  }
}
