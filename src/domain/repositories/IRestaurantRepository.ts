import { Restaurant } from '../entities/Restaurant';
import { Location } from '../value-objects/Location';
import { Category } from '../entities/Category';

interface SearchOptions {
  query?: string;
  categories?: string[];
  location?: Location;
  radius?: number;
  rating?: number;
  page: number;
  limit: number;
  sortBy?: 'rating' | 'distance' | 'name';
  order?: 'asc' | 'desc';
}

export interface IRestaurantRepository {
  // Create
  create(restaurant: Restaurant): Promise<Restaurant>;
  
  // Read
  findById(id: string): Promise<Restaurant | null>;
  findByMerchantId(merchantId: string): Promise<Restaurant[]>;
  findAll(page: number, limit: number): Promise<{ restaurants: Restaurant[]; total: number }>;
  findByCategory(categoryId: string, page: number, limit: number): Promise<{ restaurants: Restaurant[]; total: number }>;
  
  // Update
  update(id: string, restaurant: Partial<Restaurant>): Promise<Restaurant>;
  updateLocation(id: string, location: Location): Promise<Restaurant>;
  updateCategories(id: string, categories: Category[]): Promise<Restaurant>;
  updateRating(id: string, rating: number): Promise<Restaurant>;
  
  // Search
  search(options: SearchOptions): Promise<{ restaurants: Restaurant[]; total: number }>;
  // Delete
  delete(id: string): Promise<void>;
  
  // Custom queries
  searchRestaurants(
    query: string,
    page: number,
    limit: number
  ): Promise<{ restaurants: Restaurant[]; total: number }>;
  
  findNearby(
    location: Location,
    radiusInKm: number,
    page: number,
    limit: number
  ): Promise<{ restaurants: Restaurant[]; total: number }>;
  
  findByFilters(filters: {
    categories?: string[];
    rating?: number;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }>;
  
  countRestaurants(): Promise<number>;
  countByMerchant(merchantId: string): Promise<number>;
  
  isOpen(id: string): Promise<boolean>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
}
