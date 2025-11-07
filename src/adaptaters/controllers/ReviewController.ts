import { Request, Response } from 'express';
import { CreateReview } from '../../usecases/review/CreateReview';
import { DeleteReview } from '../../usecases/review/DeleteReview';
import { GetRestaurantReview } from '../../usecases/review/GetRestaurantReview';

export class ReviewController {
  constructor(
    private readonly createReview: CreateReview,
    private readonly deleteReview: DeleteReview,
    private readonly getRestaurantReview: GetRestaurantReview
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const reviewData = req.body;
      const review = await this.createReview.execute(reviewData);
      res.status(201).json(review);
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
      const reviewId = req.params.id;
      await this.deleteReview.execute(reviewId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getRestaurantReviews(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.params.restaurantId;
      const { page = 1, limit = 10, rating } = req.query;

      const reviews = await this.getRestaurantReview.execute({
        restaurantId,
        rating: rating ? Number(rating) : undefined,
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(reviews);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
