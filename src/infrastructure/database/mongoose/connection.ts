import mongoose from 'mongoose';
import { databaseConfig } from '../../config/database';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        console.log('Using existing database connection');
        return;
      }

      // Configure mongoose
      mongoose.set('strictQuery', true);
      mongoose.set('debug', process.env.NODE_ENV === 'development');

      // Connect to MongoDB
      await mongoose.connect(databaseConfig.mongodb.url, databaseConfig.mongodb.options);

      this.isConnected = true;
      console.log('Connected to MongoDB');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });

      // Handle process termination
      process.on('SIGINT', this.cleanup.bind(this));
      process.on('SIGTERM', this.cleanup.bind(this));
      process.on('SIGHUP', this.cleanup.bind(this));

    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('Error during MongoDB cleanup:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
}

const databaseConnection = DatabaseConnection.getInstance();

export const connectToDatabase = () => databaseConnection.connect();
export const disconnectFromDatabase = () => databaseConnection.disconnect();
export const getDatabaseConnection = () => databaseConnection.getConnection();
