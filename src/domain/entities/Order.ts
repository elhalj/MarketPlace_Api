import { Address } from '../value-objects/Address';
import { Price } from '../value-objects/Price';
import { Product } from './Product';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export class Order {
  constructor(
    private _id: string,
    private _userId: string,
    private _restaurantId: string,
    private _items: OrderItem[],
    private _totalPrice: Price,
    private _deliveryAddress: Address,
    private _status: OrderStatus = 'PENDING',
    private _paymentMethod: string,
    private _paymentStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING',
    private _estimatedDeliveryTime?: Date,
    private _actualDeliveryTime?: Date,
    private _notes?: string,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get restaurantId(): string {
    return this._restaurantId;
  }

  get items(): OrderItem[] {
    return this._items;
  }

  get totalPrice(): Price {
    return this._totalPrice;
  }

  get deliveryAddress(): Address {
    return this._deliveryAddress;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get estimatedDeliveryTime(): Date | undefined {
    return this._estimatedDeliveryTime;
  }

  get actualDeliveryTime(): Date | undefined {
    return this._actualDeliveryTime;
  }

  get paymentStatus(): 'PENDING' | 'PAID' | 'FAILED' {
    return this._paymentStatus;
  }

  get paymentMethod(): string {
    return this._paymentMethod;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Methods
  updateStatus(status: OrderStatus): void {
    this._status = status;
    if (status === 'DELIVERED') {
      this._actualDeliveryTime = new Date();
    }
    this._updatedAt = new Date();
  }

  setEstimatedDeliveryTime(time: Date): void {
    this._estimatedDeliveryTime = time;
    this._updatedAt = new Date();
  }

  updatePaymentStatus(status: 'PENDING' | 'PAID' | 'FAILED'): void {
    this._paymentStatus = status;
    this._updatedAt = new Date();
  }

  addItem(item: OrderItem): void {
    this._items.push(item);
    this.recalculateTotal();
    this._updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this._items = this._items.filter(item => item.product.id !== productId);
    this.recalculateTotal();
    this._updatedAt = new Date();
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const item = this._items.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.recalculateTotal();
      this._updatedAt = new Date();
    }
  }

  private recalculateTotal(): void {
    this._totalPrice = this._items.reduce(
      (total, item) => total.add(item.product.price.multiply(item.quantity)),
      new Price(0, this._totalPrice.currency)
    );
  }

  cancel(): void {
    if (this._status !== 'DELIVERED') {
      this._status = 'CANCELLED';
      this._updatedAt = new Date();
    } else {
      throw new Error('Cannot cancel a delivered order');
    }
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      restaurantId: this._restaurantId,
      items: this._items.map(item => ({
        product: item.product.toJSON(),
        quantity: item.quantity,
        notes: item.notes
      })),
      totalPrice: this._totalPrice.toJSON(),
      deliveryAddress: this._deliveryAddress.toJSON(),
      status: this._status,
      estimatedDeliveryTime: this._estimatedDeliveryTime,
      actualDeliveryTime: this._actualDeliveryTime,
      paymentStatus: this._paymentStatus,
      paymentMethod: this._paymentMethod,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
