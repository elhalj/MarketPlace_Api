import mongoose, { Model, Schema, Document } from "mongoose";

export interface IReviewDocument {
  userId: string;
  restaurantId: string;
  orderId: string;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewModel extends Model<IReviewDocument> {
  findByRestaurant(restaurantId: string): Promise<IReviewDocument[]>;
  findByUser(userId: string): Promise<IReviewDocument[]>;
  findByOrder(orderId: string): Promise<IReviewDocument | null>;
  getAverageRating(restaurantId: string): Promise<number>;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
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

reviewSchema.static('findByRestaurant', function (restaurantId: string) {
  return this.find({ restaurantId }).sort({ createdAt: -1 });
});

reviewSchema.static('findByUser', function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
});

reviewSchema.static('findByOrder', function (orderId: string) {
  return this.findOne({ orderId });
});

reviewSchema.static('getAverageRating', function (restaurantId: string) {
  return this.aggregate([
    { $match: { restaurantId } },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } },
  ]).then((result) => (result.length > 0 ? result[0].averageRating : 0));
});

export const ReviewModel = mongoose.model<IReviewDocument, IReviewModel>('Review', reviewSchema);
