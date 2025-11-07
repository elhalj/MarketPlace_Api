import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';

export interface GetProductByRestaurantDTO {
  restaurantId: string;
  page: number;
  limit: number;
  category?: string;
  available?: boolean;
}

export interface GetProductByRestaurantResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetProductByRestaurant {
  constructor(
    private readonly productRepository: IProductRepository
  ) {}

  async execute(params: GetProductByRestaurantDTO): Promise<GetProductByRestaurantResponse> {
    const { products, total } = await this.productRepository.findByRestaurantId(
      params.restaurantId,
      params.page,
      params.limit
    );

    const totalPages = Math.ceil(total / params.limit);

    return {
      products,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  }
}
