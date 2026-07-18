import mongoose, { Model, Schema, Document } from "mongoose";

export interface IProductDocument {
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  category: string;
  restaurantId: string;
  images: string[];
  ingredients: string[];
  allergens: string[];
  available: boolean;
  stock: number;
  preparationTime: number; // in minutes
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductModel extends Model<IProductDocument> {
  findByRestaurant(restaurantId: string): Promise<IProductDocument[]>;
  findByCategory(category: string): Promise<IProductDocument[]>;
  search(query: string): Promise<IProductDocument[]>;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    preparationTime: {
      type: Number,
      required: true, // in minutes
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.static('findByRestaurant', function (restaurantId: string) {
  return this.find({ restaurantId });
});

productSchema.static('findByCategory', function (category: string) {
  return this.find({ category });
});

productSchema.static('search', function (query: string) {
  return this.find({ $text: { $search: query } });
});

export const ProductModel = mongoose.model<IProductDocument, IProductModel>('Product', productSchema);
