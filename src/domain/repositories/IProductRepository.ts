import { Product } from '../entities/Product';
import { Category } from '../entities/Category';

export interface IProductRepository {
  // Create
  create(product: Product): Promise<Product>;
  
  // Read
  findById(id: string): Promise<Product | null>;
  findByRestaurantId(
    restaurantId: string,
    page: number,
    limit: number
  ): Promise<{ products: Product[]; total: number }>;
  
  findAll(page: number, limit: number): Promise<{ products: Product[]; total: number }>;
  
  // Update
  update(id: string, product: Partial<Product>): Promise<Product>;
  updateCategory(id: string, category: Category): Promise<Product>;
  updateAvailability(id: string, available: boolean): Promise<Product>;
  updateRating(id: string, rating: number): Promise<Product>;
  
  // Delete
  delete(id: string): Promise<void>;
  
  // Custom queries
  searchProducts(
    query: string,
    page: number,
    limit: number
  ): Promise<{ products: Product[]; total: number }>;
  
  findByCategory(
    categoryId: string,
    page: number,
    limit: number
  ): Promise<{ products: Product[]; total: number }>;
  
  findByFilters(filters: {
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    available?: boolean;
    rating?: number;
    restaurantId?: string;
    page: number;
    limit: number;
  }): Promise<{ products: Product[]; total: number }>;
  
  countProducts(): Promise<number>;
  countByRestaurant(restaurantId: string): Promise<number>;
  countByCategory(categoryId: string): Promise<number>;
  
  updateStock(id: string, quantity: number): Promise<void>;
  checkAvailability(id: string): Promise<boolean>;
}
