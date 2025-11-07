<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import env from '../config/environment';
import { errorHandler } from '../../adaptaters/middlewares/errorHandler';
import { rateLimiter } from '../../adaptaters/middlewares/rateLimiter';
import routes from './routes';
import { connectToDatabase } from '../database/mongoose/connection';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(mongoSanitize()); // Prevent MongoDB Operator Injection

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compression
app.use(compression());

// Logging
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(rateLimiter);

// API routes
app.use(`${env.apiPrefix}/${env.apiVersion}`, routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling
app.use(errorHandler);

// Handle unhandled routes
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  
  // Close server
  const server = app.listen();
  if (server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }

  // Close database connections
  // Add any other cleanup tasks here

  console.log('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app };

export default app;
=======
import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan'
import cookieParser from 'cookie-parser';
import compression from 'compression';



export function startServer(/*routes: Router[]*/): Express {

    const app = express()

    app.use(express.json())

    app.use(express.urlencoded({}))
    app.use(cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }))

    app.use(compression())
    app.use(cookieParser())

    app.use(helmet({
        crossOriginResourcePolicy: false,
    }))

    app.use(morgan("dev"))

    app.get("/", (req, res) => {
        res.send("Hello World")
    })

    app.get("/health", (req, res) => {
        res.status(200).json({ message: "OK" })
    })

    // routes.forEach(route => {
    //     app.use("/api/v1", route)
    // })

    return app
}
>>>>>>> 3d886706fd4d8f64ff3d6f09fbc9e57f62431308
