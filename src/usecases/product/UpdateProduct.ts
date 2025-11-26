import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Price } from '../../domain/value-objects/Price';

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: {
    amount: number;
    currency: string;
  };
  categoryId?: string;
  images?: string[];
  ingredients?: string[];
  allergens?: string[];
  available?: boolean;
  preparationTime?: number;
  merchantId: string; // Required for authorization
}

export class UpdateProduct {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(id: string, data: UpdateProductDTO): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Verify merchant owns the restaurant that owns this product
    const restaurant = await this.restaurantRepository.findById(existingProduct.restaurantId);
    if (!restaurant || restaurant.merchantId !== data.merchantId) {
      throw new Error('Not authorized to update this product');
    }

    // Prepare update data
    const updates: Partial<{
      name: string;
      description: string;
      price: Price;
      images: string[];
      ingredients: string[];
      allergens: string[];
      available: boolean;
      preparationTime: number;
      updatedAt: Date;
    }> = {
      updatedAt: new Date()
    };

    if (data.name) {
      updates.name = data.name;
    }
    
    if (data.description) {
      updates.description = data.description;
    }
    
    if (data.price) {
      updates.price = new Price(data.price.amount, data.price.currency);
    }
    
    if (data.images) {
      updates.images = data.images;
    }
    
    if (data.ingredients) {
      updates.ingredients = data.ingredients;
    }
    
    if (data.allergens) {
      updates.allergens = data.allergens;
    }
    
    if (data.available !== undefined) {
      updates.available = data.available;
    }
    
    if (data.preparationTime) {
      updates.preparationTime = data.preparationTime;
    }

    // Update the product
    return this.productRepository.update(id, updates);
  }
}


