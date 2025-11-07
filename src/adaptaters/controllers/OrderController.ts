import { Request, Response } from 'express';
import { CreateOrder } from '../../usecases/order/CreateOrder';
import { GetOrderByOrder } from '../../usecases/order/GetOrderByOrder';
import { GetUserOrder } from '../../usecases/order/GetUserOrder';
import { GetMerchantOrder } from '../../usecases/order/GetMerchantOrder';
import { UpdateOrderStatus } from '../../usecases/order/UpdateOrderStatus';

export class OrderController {
  constructor(
    private readonly createOrder: CreateOrder,
    private readonly getOrderByOrder: GetOrderByOrder,
    private readonly getUserOrder: GetUserOrder,
    private readonly getMerchantOrder: GetMerchantOrder,
    private readonly updateOrderStatus: UpdateOrderStatus
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const order = await this.createOrder.execute(orderData);
      res.status(201).json(order);
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
      const orderId = req.params.id;
      const order = await this.getOrderByOrder.execute(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      res.status(200).json(order);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const { page = 1, limit = 10, status } = req.query;

      const orders = await this.getUserOrder.execute({
        userId,
        status: status ? String(status) : undefined,
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(orders);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getMerchantOrders(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.params.merchantId;
      const { page = 1, limit = 10, status } = req.query;

      const orders = await this.getMerchantOrder.execute({
        merchantId,
        status: status ? String(status) : undefined,
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(orders);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

      const updatedOrder = await this.updateOrderStatus.execute({
        orderId,
        status
      });

      res.status(200).json(updatedOrder);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
