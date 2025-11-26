import { Restaurant } from '../../domain/entities/Restaurant';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import { Address } from '../../domain/value-objects/Address';
import { Location } from '../../domain/value-objects/Location';
import { OpeningHours } from '../../domain/value-objects/OpeningHours';
// import { Category } from '../../domain/entities/Category';

export interface CreateRestaurantDTO {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    details?: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  categories: string[]; // Category IDs
  openingHours: {
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    openTime: string;
    closeTime: string;
    isClosed?: boolean;
  }[];
  images: string[];
  merchantId: string;
}

export class CreateRestaurant {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly merchantRepository: IMerchantRepository
  ) {}

  async execute(data: CreateRestaurantDTO): Promise<Restaurant> {
    // Verify merchant exists and is verified
    const merchant = await this.merchantRepository.findById(data.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    if (!merchant.isVerified) {
      throw new Error('Merchant is not verified');
    }

    // Create value objects
    const address = new Address(
      data.address.street,
      data.address.city,
      data.address.state,
      data.address.country,
      data.address.zipCode,
      data.address.details
    );

    const location = new Location(
      data.location.latitude,
      data.location.longitude
    );

    const openingHours = data.openingHours.map(hour => 
      new OpeningHours(
        hour.day,
        hour.openTime,
        hour.closeTime,
        hour.isClosed
      )
    );

    // Create restaurant
    const restaurant = new Restaurant(
      crypto.randomUUID(),
      data.name,
      data.description,
      address,
      location,
      data.phone,
      [], // Categories will be added later
      openingHours,
      data.images,
      0, // Initial rating
      0, // Initial total reviews
      true, // Active by default
      data.merchantId
    );

    // Save restaurant
    const savedRestaurant = await this.restaurantRepository.create(restaurant);

    return savedRestaurant;
  }
}
