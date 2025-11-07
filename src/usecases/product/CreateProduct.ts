import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Price } from '../../domain/value-objects/Price';
import { Category } from '../../domain/entities/Category';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  categoryId: string;
  restaurantId: string;
  images: string[];
  ingredients: string[];
  allergens: string[];
  preparationTime: number;
}

export class CreateProduct {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly restaurantRepository: IRestaurantRepository
  ) {}

  async execute(data: CreateProductDTO): Promise<Product> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findById(data.restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Create price value object
    const price = new Price(data.price.amount, data.price.currency);

    // Create product
    const product = new Product(
      crypto.randomUUID(),
      data.name,
      data.description,
      price,
      data.categoryId,
      data.restaurantId,
      data.images,
      data.ingredients,
      data.allergens,
      true, // Available by default
      data.preparationTime,
      0, // Initial rating
      0  // Initial total reviews
    );

    // Save product
    const savedProduct = await this.productRepository.create(product);

    return savedProduct;
  }
}
