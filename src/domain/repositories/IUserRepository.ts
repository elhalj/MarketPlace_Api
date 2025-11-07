import User from '../entities/User';


export interface IUserRepository {
  // Create
  create(user: User): Promise<User>;
  
  // Read
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findAll(page: number, limit: number): Promise<{ users: User[]; total: number }>;
  
  // Update
  update(id: string, user: Partial<User>): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  verifyUser(id: string): Promise<User>;
  
  // Delete
  delete(id: string): Promise<void>;
  
  // Custom queries
  searchUsers(query: string, page: number, limit: number): Promise<{ users: User[]; total: number }>;
  countUsers(): Promise<number>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
}
