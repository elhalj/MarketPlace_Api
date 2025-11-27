import mongoose, { Model, Schema, Document } from "mongoose";

export interface IRestaurantDocument {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  phone: string;
  categories: string[];
  openingHours: {
    day: string;
    opening: string;
    closing: string;
  }[];
  images: string[];
  rating: number;
  totalReviews: number;
  isActive: boolean;
  merchantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestaurantModel extends Model<IRestaurantDocument> {
  findByMerchant(merchantId: string): Promise<IRestaurantDocument[]>;
  findNearby(longitude: number, latitude: number, maxDistance: number): Promise<IRestaurantDocument[]>;
}

const restaurantSchema = new Schema<IRestaurantDocument>(
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
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere',
      },
    },
    phone: {
      type: String,
      required: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    openingHours: [
      {
        day: { type: String, required: true },
        opening: { type: String, required: true },
        closing: { type: String, required: true },
      },
    ],
    images: {
      type: [String],
      default: [],
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
    isActive: {
      type: Boolean,
      default: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
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

restaurantSchema.static('findByMerchant', function (merchantId: string) {
  return this.find({ merchantId });
});

restaurantSchema.static('findNearby', function (longitude: number, latitude: number, maxDistance: number = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  });
});

export const RestaurantModel = mongoose.model<IRestaurantDocument, IRestaurantModel>('Restaurant', restaurantSchema);
