import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Restaurant } from '../../domain/entities/Restaurant';
import mongoose from 'mongoose';
import { Location } from '../../domain/value-objects/Location';
import { Address } from '../../domain/value-objects/Address';
import { OpeningHours } from '../../domain/value-objects/OpeningHours';

const RestaurantSchema = new mongoose.Schema({
  merchantId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  cuisine: { type: [String], required: true },
  priceRange: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  openingHours: [{
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true }
  }],
  imageUrls: [{ type: String }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Create a geospatial index
RestaurantSchema.index({ location: '2dsphere' });

const RestaurantModel = mongoose.model('Restaurant', RestaurantSchema);

export class MongoRestaurantRepository implements IRestaurantRepository {
  async create(restaurant: Restaurant): Promise<Restaurant> {
    const newRestaurant = await RestaurantModel.create(restaurant);
    return this.mapToEntity(newRestaurant);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const restaurant = await RestaurantModel.findById(id);
    return restaurant ? this.mapToEntity(restaurant) : null;
  }

  async findAll(page: number, limit: number): Promise<{ restaurants: Restaurant[]; total: number }> {
    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      RestaurantModel.find().skip(skip).limit(limit),
      RestaurantModel.countDocuments()
    ]);
    return {
      restaurants: restaurants.map(restaurant => this.mapToEntity(restaurant)),
      total
    };
  }

  async findByMerchantId(merchantId: string): Promise<Restaurant[]> {
    const restaurants = await RestaurantModel.find({ merchantId });
    return restaurants.map(restaurant => this.mapToEntity(restaurant));
  }

  async countRestaurants(): Promise<number> {
    return RestaurantModel.countDocuments();
  }

  async countByMerchant(merchantId: string): Promise<number> {
    return RestaurantModel.countDocuments({ merchantId });
  }

  async isOpen(id: string): Promise<boolean> {
    const restaurant = await RestaurantModel.findById(id);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    const todayHours = restaurant.openingHours.find(hours => hours.day === currentDay);
    if (!todayHours) {
      return false;
    }

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  async findByCategory(
    categoryId: string,
    page: number,
    limit: number
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { categories: categoryId };
    const [restaurants, total] = await Promise.all([
      RestaurantModel.find(filter).skip(skip).limit(limit),
      RestaurantModel.countDocuments(filter)
    ]);
    return {
      restaurants: restaurants.map(restaurant => this.mapToEntity(restaurant)),
      total
    };
  }

  async updateCategories(id: string, categories: Category[]): Promise<Restaurant> {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      { $set: { categories: categories.map(cat => cat.id) } },
      { new: true }
    );
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    return this.mapToEntity(restaurant);
  }

  async activate(id: string): Promise<void> {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      { $set: { status: 'ACTIVE' } }
    );
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
  }

  async deactivate(id: string): Promise<void> {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      { $set: { status: 'INACTIVE' } }
    );
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
  }

  async findNearby(
    location: Location,
    radiusInKm: number,
    page: number,
    limit: number
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    const skip = (page - 1) * limit;
    const geoQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: radiusInKm * 1000 // convert km to meters
        }
      }
    };

    const [restaurants, total] = await Promise.all([
      RestaurantModel.find(geoQuery).skip(skip).limit(limit),
      RestaurantModel.countDocuments(geoQuery)
    ]);

    return {
      restaurants: restaurants.map(restaurant => this.mapToEntity(restaurant)),
      total
    };
  }

  async search(
    query: string,
    filters: {
      cuisine?: string[];
      priceRange?: string;
      rating?: number;
    },
    page: number,
    limit: number
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    const skip = (page - 1) * limit;
    const searchQuery: any = {
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { cuisine: new RegExp(query, 'i') }
      ]
    };

    if (filters.cuisine?.length) {
      searchQuery.cuisine = { $in: filters.cuisine };
    }
    if (filters.priceRange) {
      searchQuery.priceRange = filters.priceRange;
    }
    if (filters.rating) {
      searchQuery.rating = { $gte: filters.rating };
    }

    const [restaurants, total] = await Promise.all([
      RestaurantModel.find(searchQuery).skip(skip).limit(limit),
      RestaurantModel.countDocuments(searchQuery)
    ]);

    return {
      restaurants: restaurants.map(restaurant => this.mapToEntity(restaurant)),
      total
    };
  }

  async update(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    if (!updatedRestaurant) {
      throw new Error('Restaurant not found');
    }
    return this.mapToEntity(updatedRestaurant);
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<Restaurant> {
    const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updatedRestaurant) {
      throw new Error('Restaurant not found');
    }
    return this.mapToEntity(updatedRestaurant);
  }

  async delete(id: string): Promise<void> {
    await RestaurantModel.findByIdAndDelete(id);
  }

  async searchRestaurants(
    query: string,
    page: number,
    limit: number
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    const skip = (page - 1) * limit;
    const searchQuery = {
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { cuisine: new RegExp(query, 'i') }
      ]
    };
    const [restaurants, total] = await Promise.all([
      RestaurantModel.find(searchQuery).skip(skip).limit(limit),
      RestaurantModel.countDocuments(searchQuery)
    ]);
    return {
      restaurants: restaurants.map(restaurant => this.mapToEntity(restaurant)),
      total
    };
  }

  async findByFilters(filters: {
    categories?: string[];
    rating?: number;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    const { categories, rating, isActive, page, limit } = filters;
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (categories?.length) {
      query.categories = { $in: categories };
    }
    if (rating !== undefined) {
      query.rating = { $gte: rating };
    }
    if (isActive !== undefined) {
      query.status = isActive ? 'ACTIVE' : 'INACTIVE';
    }

    const [restaurants, total] = await Promise.all([
      RestaurantModel.find(query).skip(skip).limit(limit),
      RestaurantModel.countDocuments(query)
    ]);
    return {
      restaurants: restaurants.map(restaurant => this.mapToEntity(restaurant)),
      total
    };
  }

  async updateRating(id: string, rating: number): Promise<Restaurant> {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      { $set: { rating } },
      { new: true }
    );
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    return this.mapToEntity(restaurant);
  }

  async addImage(id: string, imageUrl: string): Promise<void> {
    await RestaurantModel.findByIdAndUpdate(
      id,
      { $addToSet: { imageUrls: imageUrl } }
    );
  }

  async removeImage(id: string, imageUrl: string): Promise<void> {
    await RestaurantModel.findByIdAndUpdate(
      id,
      { $pull: { imageUrls: imageUrl } }
    );
  }

  async updateLocation(id: string, location: Location): Promise<Restaurant> {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
      id,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          }
        }
      },
      { new: true }
    );
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    return this.mapToEntity(restaurant);
  }

  private mapToEntity(model: any): Restaurant {
    const address = new Address(
      model.address.street,
      model.address.city,
      model.address.state,
      model.address.country,
      model.address.postalCode
    );

    const location = new Location(
      model.location.coordinates[1], // latitude
      model.location.coordinates[0]  // longitude
    );

    const openingHours = model.openingHours.map((hours: any) =>
      new OpeningHours(hours.day, hours.open, hours.close)
    );

    return new Restaurant(
      model._id.toString(),
      model.merchantId,
      model.name,
      model.description,
      address,
      location,
      model.cuisine,
      model.priceRange,
      openingHours,
      model.imageUrls,
      model.status,
      model.rating,
      model.reviewCount,
      model.createdAt,
      model.updatedAt
    );
  }
}
