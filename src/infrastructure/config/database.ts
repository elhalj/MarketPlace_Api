export const databaseConfig = {
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/marketplace',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'marketplace:',
    // Retry strategy for Redis connection
    retryStrategy: (times: number) => {
      // Maximum retry delay is 3 seconds
      const delay = Math.min(times * 50, 3000);
      return delay;
    },
    // Maximum number of retries before giving up
    maxRetriesPerRequest: 3,
  },
};

export const collections = {
  users: 'users',
  merchants: 'merchants',
  restaurants: 'restaurants',
  products: 'products',
  orders: 'orders',
  reviews: 'reviews',
  categories: 'categories',
};

export const indices = {
  users: [
    { email: 1 }, // For user lookup by email
    { createdAt: 1 }, // For sorting by creation date
  ],
  merchants: [
    { email: 1 },
    { businessName: 1 },
    { isVerified: 1 },
  ],
  restaurants: [
    { merchantId: 1 },
    { name: 1 },
    { location: '2dsphere' }, // For geospatial queries
    { isActive: 1 },
    { categories: 1 },
  ],
  products: [
    { restaurantId: 1 },
    { category: 1 },
    { name: 'text' }, // For text search
    { isAvailable: 1 },
  ],
  orders: [
    { userId: 1 },
    { restaurantId: 1 },
    { status: 1 },
    { createdAt: 1 },
  ],
  reviews: [
    { restaurantId: 1 },
    { userId: 1 },
    { createdAt: 1 },
  ],
};

// Cache configuration for different types of data
export const cacheConfig = {
  restaurant: {
    ttl: 3600, // 1 hour
    prefix: 'restaurant:',
  },
  product: {
    ttl: 1800, // 30 minutes
    prefix: 'product:',
  },
  user: {
    ttl: 7200, // 2 hours
    prefix: 'user:',
  },
  category: {
    ttl: 86400, // 24 hours
    prefix: 'category:',
  },
  // Session configuration
  session: {
    ttl: 86400 * 7, // 7 days
    prefix: 'session:',
  },
  // Rate limiting configuration
  rateLimit: {
    ttl: 60, // 1 minute
    prefix: 'rate:',
  },
};
