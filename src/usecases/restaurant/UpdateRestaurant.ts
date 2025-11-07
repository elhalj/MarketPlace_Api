import { Restaurant } from '../../domain/entities/Restaurant';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Address } from '../../domain/value-objects/Address';
import { Category } from '../../domain/entities/Category';
import { OpeningHours } from '../../domain/value-objects/OpeningHours';

export interface UpdateRestaurantDTO {
  name?: string;
  description?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    details?: string;
  };
  phone?: string;
  categories?: string[]; // Category IDs
  openingHours?: {
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    openTime: string;
    closeTime: string;
    isClosed?: boolean;
  }[];
  images?: string[];
}

export class UpdateRestaurant {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(id: string, data: UpdateRestaurantDTO): Promise<Restaurant> {
    // Check if restaurant exists
    const existingRestaurant = await this.restaurantRepository.findById(id);
    if (!existingRestaurant) {
      throw new Error('Restaurant not found');
    }

    // Prepare update data
    const updateData: Partial<Restaurant> = {};

    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.phone) updateData.phone = data.phone;
    if (data.images) updateData.images = data.images;

    // Handle address update
    if (data.address) {
      const address = new Address(
        data.address.street,
        data.address.city,
        data.address.state,
        data.address.country,
        data.address.zipCode,
        data.address.details
      );
      updateData.address = address;
    }

    // Handle opening hours update
    if (data.openingHours) {
      const openingHours = data.openingHours.map(hour => 
        new OpeningHours(
          hour.day,
          hour.openTime,
          hour.closeTime,
          hour.isClosed
        )
      );
      updateData.openingHours = openingHours;
    }

    // Update restaurant
    const updatedRestaurant = await this.restaurantRepository.update(id, updateData);
    if (!updatedRestaurant) {
      throw new Error('Failed to update restaurant');
    }

    return updatedRestaurant;
  }
}
