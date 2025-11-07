import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../../infrastructure/database/redis/client';

const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100 // limit each IP to 100 requests per windowMs
) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:'
    }),
    windowMs,
    max,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
  });
};

// Default rate limiter for general API endpoints
export const defaultRateLimiter = createRateLimiter();

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5 // limit each IP to 5 requests per windowMs
);

// Rate limiter for search endpoints
export const searchRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30 // limit each IP to 30 requests per minute
);

// Rate limiter for order creation
export const orderRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  50 // limit each IP to 50 orders per hour
);

// Rate limiter for review submission
export const reviewRateLimiter = createRateLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  10 // limit each IP to 10 reviews per day
);
