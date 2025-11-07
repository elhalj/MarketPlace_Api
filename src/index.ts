import 'dotenv/config';
import { connectToDatabase } from '@infra/database/mongoose/connection';
import { connectToRedis } from '@infra/database/redis/connection';
import app from '@infra/server/app';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('📦 Connected to MongoDB');

    // Connect to Redis
    await connectToRedis();
    console.log('🚀 Connected to Redis');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🌐 Server is running on port ${PORT}`);
      console.log(`🔗 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
