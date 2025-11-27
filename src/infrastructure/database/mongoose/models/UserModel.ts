import mongoose, { Model, Schema, Document } from "mongoose";

export interface IUserDocument {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'merchant' | 'admin';
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'merchant', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
    },
    lastLogin: {
      type: Date,
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

userSchema.static('findByEmail', function (email: string) {
  return this.findOne({ email });
});

export const UserModel = mongoose.model<IUserDocument, IUserModel>('User', userSchema);