import { Request, Response } from 'express';
import { CreateProduct } from '../../usecases/product/CreateProduct';
import { UpdateProduct } from '../../usecases/product/UpdateProduct';
import { DeleteProduct } from '../../usecases/product/DeleteProduct';
import { GetProductByRestaurant } from '../../usecases/product/GetProductByRestaurant';
import { SearchProduct } from '../../usecases/product/SearchProduct';
import { UpdateProductStock } from '../../usecases/product/UpdateProductStock';

export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct,
    private readonly updateProduct: UpdateProduct,
    private readonly deleteProduct: DeleteProduct,
    private readonly getProductByRestaurant: GetProductByRestaurant,
    private readonly searchProduct: SearchProduct,
    private readonly updateProductStock: UpdateProductStock
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const productData = req.body;
      const product = await this.createProduct.execute(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const updateData = req.body;
      const updatedProduct = await this.updateProduct.execute(productId, updateData);
      res.status(200).json(updatedProduct);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      await this.deleteProduct.execute(productId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getByRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.params.restaurantId;
      const { page = 1, limit = 10 } = req.query;
      
      const products = await this.getProductByRestaurant.execute({
        restaurantId,
        page: Number(page),
        limit: Number(limit)
      });
      
      res.status(200).json(products);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        category,
        minPrice,
        maxPrice,
        available,
        page = 1,
        limit = 10
      } = req.query;

      const results = await this.searchProduct.execute({
        query: String(query),
        category: category ? String(category) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        available: available ? Boolean(available) : undefined,
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(results);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const { quantity } = req.body;

      await this.updateProductStock.execute({
        productId,
        quantity: Number(quantity)
      });

      res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
