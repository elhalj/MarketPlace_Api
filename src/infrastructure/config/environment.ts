interface Environment {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  port: number;
  apiVersion: string;
  apiPrefix: string;
  corsOrigin: string | string[];
  mongodbUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  mailServiceApiKey: string;
  mailServiceSender: string;
  logLevel: string;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
  uploadLimits: {
    fileSize: number;
    files: number;
  };
}

const environment: Environment = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Server configuration
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') :
    'http://localhost:3000',

  // Database URLs
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/marketplace',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudinary configuration
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',

  // Email service configuration
  mailServiceApiKey: process.env.MAIL_SERVICE_API_KEY || '',
  mailServiceSender: process.env.MAIL_SERVICE_SENDER || 'noreply@marketplace.com',

  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',

  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Upload limits
  uploadLimits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '5242880'), // 5MB
    files: parseInt(process.env.UPLOAD_MAX_FILES || '5'),
  },
};

// Validate required environment variables in production
if (environment.isProduction) {
  const requiredEnvVars = [
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MAIL_SERVICE_API_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default environment;
