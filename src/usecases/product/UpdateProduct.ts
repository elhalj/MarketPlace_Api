import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
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
}

export class UpdateProduct {
  constructor(
    private readonly productRepository: IProductRepository
  ) {}

  async execute(id: string, data: UpdateProductDTO): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Prepare update data
    const updateData: Partial<Product> = {};

    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.images) updateData.images = data.images;
    if (data.ingredients) updateData.ingredients = data.ingredients;
    if (data.allergens) updateData.allergens = data.allergens;
    if (data.available !== undefined) updateData.available = data.available;
    if (data.preparationTime) updateData.preparationTime = data.preparationTime;

    // Handle price update
    if (data.price) {
      const price = new Price(data.price.amount, data.price.currency);
      updateData.price = price;
    }

    // Update product
    const updatedProduct = await this.productRepository.update(id, updateData);
    if (!updatedProduct) {
      throw new Error('Failed to update product');
    }

    return updatedProduct;
  }
}
