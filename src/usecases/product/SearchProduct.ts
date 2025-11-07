import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';

export interface SearchProductDTO {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  page: number;
  limit: number;
}

export interface SearchProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SearchProduct {
  constructor(
    private readonly productRepository: IProductRepository
  ) {}

  async execute(params: SearchProductDTO): Promise<SearchProductResponse> {
    // Search products with filters
    const { products, total } = await this.productRepository.findByFilters({
      query: params.query,
      categories: params.category ? [params.category] : undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      available: params.available,
      page: params.page,
      limit: params.limit
    });

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
