import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export interface IUser {
  id?: string;
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

export default class User implements IUser {
  id?: string;
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

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: 'user' | 'merchant' | 'admin',
    isVerified: boolean,
    isActive: boolean,
    id?: string,
    avatar?: string,
    refreshToken?: string,
    lastLogin?: Date,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.role = role;
    this.avatar = avatar;
    this.isVerified = isVerified;
    this.isActive = isActive;
    this.refreshToken = refreshToken;
    this.lastLogin = lastLogin || new Date();
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  static async create(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: 'user' | 'merchant' | 'admin',
    isVerified: boolean,
    isActive: boolean,
    id?: string,
    avatar?: string,
    refreshToken?: string,
    lastLogin?: Date,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User(
      firstName,
      lastName,
      email,
      hashedPassword,
      role,
      isVerified,
      isActive,
      id,
      avatar,
      refreshToken,
      lastLogin,
      createdAt,
      updatedAt
    );
    return user;
  }

  async comparePassword(password: string) {
    return await bcrypt.compare(password, this.password);
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async generateRefreshToken() {
    this.refreshToken = crypto.randomInt(100000, 999999).toString();
  }
}