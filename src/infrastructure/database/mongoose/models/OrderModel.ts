import mongoose, { Model, Schema } from "mongoose";



export interface IOrder{
    orderNumer: string;
    merchantId: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'CASH';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    deliveryAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


export interface IOrderDocument extends IOrder, Document { }

export interface IOrderModel extends Model<IOrderDocument> {
    findByOrderNumber(orderNumber: string): Promise<IOrderDocument | null>;
}

const orderSchema = new Schema<IOrderDocument>(
    {
        orderNumer: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        merchantId: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
            default: 'PENDING',
        },
        paymentMethod: {
            type: String,
            enum: ['CREDIT_CARD', 'PAYPAL', 'CASH'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING',
        },
        items: [
            {
                productId: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        deliveryAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        notes: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    }
)

export const OrderModelName = mongoose.model<IOrderDocument, IOrderModel>('Order', orderSchema);