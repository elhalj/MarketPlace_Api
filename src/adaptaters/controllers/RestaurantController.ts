import { Request, Response } from 'express';
import { CreateRestaurant } from '../../usecases/restaurant/CreateRestaurant';
import { GetRestaurantById } from '../../usecases/restaurant/GetRestaurantById';
import { UpdateRestaurant } from '../../usecases/restaurant/UpdateRestaurant';
import { DeleteRestaurant } from '../../usecases/restaurant/DeleteRestaurant';
import { GetNearbyRestaurants } from '../../usecases/restaurant/GetNearbyRestaurants';
import { SearchRestaurant } from '../../usecases/restaurant/SearchRestaurant';
import { UpdateLocation } from '../../usecases/restaurant/UpdateLocation';

export class RestaurantController {
  constructor(
    private readonly createRestaurant: CreateRestaurant,
    private readonly getRestaurantById: GetRestaurantById,
    private readonly updateRestaurant: UpdateRestaurant,
    private readonly deleteRestaurant: DeleteRestaurant,
    private readonly getNearbyRestaurants: GetNearbyRestaurants,
    private readonly searchRestaurant: SearchRestaurant,
    private readonly updateLocation: UpdateLocation
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const restaurantData = req.body;
      const restaurant = await this.createRestaurant.execute(restaurantData);
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.params.id;
      const restaurant = await this.getRestaurantById.execute(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }
      res.status(200).json(restaurant);
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
      const restaurantId = req.params.id;
      const updateData = req.body;
      const updatedRestaurant = await this.updateRestaurant.execute(restaurantId, updateData);
      res.status(200).json(updatedRestaurant);
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
      const restaurantId = req.params.id;
      await this.deleteRestaurant.execute(restaurantId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getNearby(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius } = req.query;
      const { page = 1, limit = 10 } = req.query;

      const restaurants = await this.getNearbyRestaurants.execute({
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius),
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(restaurants);
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
      const { query, categories, rating, page = 1, limit = 10 } = req.query;

      const results = await this.searchRestaurant.execute({
        query: String(query),
        categories: categories ? String(categories).split(',') : undefined,
        rating: rating ? Number(rating) : undefined,
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

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.params.id;
      const { latitude, longitude } = req.body;

      const updatedRestaurant = await this.updateLocation.execute({
        restaurantId,
        latitude: Number(latitude),
        longitude: Number(longitude)
      });

      res.status(200).json(updatedRestaurant);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
