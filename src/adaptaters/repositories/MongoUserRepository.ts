import { IUserRepository } from '../../domain/repositories/IUserRepository';
import User from '../../domain/entities/User';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String },
  lastLogin: { type: Date },
  role: {
    type: String,
    enum: ['user', 'merchant', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

const UserModel = mongoose.model('User', UserSchema);

export class MongoUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const newUser = await UserModel.create(user);
    return this.mapToEntity(newUser);
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    return user ? this.mapToEntity(user) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await UserModel.findOne({ phoneNumber: phone });
    return user ? this.mapToEntity(user) : null;
  }

  async findAll(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find().skip(skip).limit(limit),
      UserModel.countDocuments()
    ]);
    return {
      users: users.map(user => this.mapToEntity(user)),
      total
    };
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return this.mapToEntity(updatedUser);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: { password: hashedPassword } }
    );
    if (!user) {
      throw new Error('User not found');
    }
  }

  async delete(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }

  async verifyUser(id: string): Promise<User> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: { isVerified: true } },
      { new: true }
    );
    if (!user) {
      throw new Error('User not found');
    }
    return this.mapToEntity(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email });
    return count > 0;
  }

  async searchUsers(
    query: string,
    page: number,
    limit: number
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const searchQuery = { $text: { $search: query } };
    const [users, total] = await Promise.all([
      UserModel.find(searchQuery).skip(skip).limit(limit),
      UserModel.countDocuments(searchQuery)
    ]);
    return {
      users: users.map(user => this.mapToEntity(user)),
      total
    };
  }

  async countUsers(): Promise<number> {
    return UserModel.countDocuments();
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ phoneNumber: phone });
    return count > 0;
  }

  private mapToEntity(model: any): User {
    return new User(
      model._id.toString(),
      model.firstName,
      model.lastName,
      model.email,
      model.password,
      model.role,
      model.avatar,
      model.isVerified,
      model.isActive,
      model.refreshToken,
      model.lastLogin,
      model.createdAt,
      model.updatedAt
    );
  }
}
