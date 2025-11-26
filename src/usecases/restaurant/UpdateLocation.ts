import { Location } from '@domain/value-objects/Location';
import { Restaurant } from '@domain/entities/Restaurant';
import { IRestaurantRepository } from '@domain/repositories/IRestaurantRepository';

interface UpdateLocationDTO {
  restaurantId: string;
  merchantId: string; // Pour vérifier l'autorisation
  latitude: number;
  longitude: number;
}

export class UpdateLocation {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute(dto: UpdateLocationDTO): Promise<Restaurant> {
    // Récupérer le restaurant
    const restaurant = await this.restaurantRepository.findById(dto.restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Vérifier l'autorisation
    if (restaurant.merchantId !== dto.merchantId) {
      throw new Error('Not authorized to update this restaurant location');
    }

    // Créer le nouvel objet Location
    const newLocation = new Location(dto.latitude, dto.longitude);

    // Mettre à jour la localisation
    return this.restaurantRepository.updateLocation(dto.restaurantId, newLocation);
  }
}
