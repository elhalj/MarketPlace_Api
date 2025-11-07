# Configuration de l'API Marketplace

## 1. Configuration de l'environnement

### Fichier : `backend/src/infrastructure/config/environment.js`

```javascript
require('dotenv').config();

const config = {
  // Environnement
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // Base de données
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: parseInt(process.env.REDIS_TTL || '3600', 10)
    }
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@marketplace.com'
  },

  // Mapbox / Geocoding
  mapbox: {
    token: process.env.MAPBOX_TOKEN
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // Upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};

module.exports = config;
```

## 2. Configuration de la base de données

### 2.1 Connexion MongoDB avec Mongoose

#### Fichier : `backend/src/infrastructure/database/mongoose/connection.js`

```javascript
const mongoose = require('mongoose');
const config = require('../../config/environment');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mongoose.connect(
        config.database.mongodb.uri,
        config.database.mongodb.options
      );

      console.log(`✅ MongoDB connecté: ${this.connection.connection.host}`);

      // Gestion des événements
      mongoose.connection.on('error', (err) => {
        console.error('❌ Erreur MongoDB:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB déconnecté');
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.connection.close();
      console.log('MongoDB déconnecté proprement');
    }
  }

  async clearDatabase() {
    if (config.nodeEnv === 'test') {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  }
}

module.exports = new Database();
```

### 2.2 Client Redis pour le cache

#### Fichier : `backend/src/infrastructure/database/redis/client.js`

```javascript
const redis = require('redis');
const config = require('../../config/environment');

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: config.database.redis.url
      });

      this.client.on('error', (err) => {
        console.error('❌ Erreur Redis:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connecté');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Erreur de connexion Redis:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erreur Redis GET:', error);
      return null;
    }
  }

  async set(key, value, ttl = config.database.redis.ttl) {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erreur Redis SET:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Erreur Redis DELETE:', error);
      return false;
    }
  }

  async clear() {
    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error('Erreur Redis CLEAR:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('Redis déconnecté proprement');
    }
  }
}

module.exports = new RedisClient();
```

## 3. Configuration du serveur

### 3.1 Configuration de l'application Express

#### Fichier : `backend/src/infrastructure/server/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('../config/environment');
const errorHandler = require('../../adapters/middlewares/errorHandler');
const routes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Sécurité
    this.app.use(helmet());
    this.app.use(cors(config.cors));
    this.app.use(mongoSanitize());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Trop de requêtes, veuillez réessayer plus tard.'
    });
    this.app.use('/api', limiter);

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });
  }

  setupRoutes() {
    this.app.use('/api', routes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} non trouvée`
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();
```

### 3.2 Définition des routes API

#### Fichier : `backend/src/infrastructure/server/routes.js`

```javascript
const express = require('express');
const router = express.Router();

// Import des controllers
const UserController = require('../../adapters/controllers/UserController');
const MerchantController = require('../../adapters/controllers/MerchantController');
const RestaurantController = require('../../adapters/controllers/RestaurantController');
const ProductController = require('../../adapters/controllers/ProductController');
const OrderController = require('../../adapters/controllers/OrderController');
const ReviewController = require('../../adapters/controllers/ReviewController');

// Middleware d'authentification
const authMiddleware = require('../../adapters/middlewares/authMiddleware');

// Routes publiques
router.get('/', (req, res) => {
  res.json({
    message: 'API Marketplace Local',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      restaurants: '/api/restaurants',
      products: '/api/products',
      orders: '/api/orders',
      reviews: '/api/reviews'
    }
  });
});

// ===== AUTH ROUTES =====
router.post('/auth/register', UserController.register);
router.post('/auth/login', UserController.login);
router.post('/auth/refresh', UserController.refreshToken);
router.post('/auth/logout', authMiddleware, UserController.logout);
router.get('/auth/me', authMiddleware, UserController.getCurrentUser);

// ===== USER ROUTES =====
router.get('/users/:id', authMiddleware, UserController.getUserById);
router.put('/users/:id', authMiddleware, UserController.updateUser);
router.delete('/users/:id', authMiddleware, UserController.deleteUser);

// ===== MERCHANT ROUTES =====
router.post('/merchants/register', MerchantController.registerMerchant);
router.get('/merchants/:id', MerchantController.getMerchantById);
router.put('/merchants/:id', authMiddleware, MerchantController.updateMerchant);
router.get('/merchants/:id/restaurants', MerchantController.getMerchantRestaurants);

// ===== RESTAURANT ROUTES =====
router.post('/restaurants', authMiddleware, RestaurantController.createRestaurant);
router.get('/restaurants', RestaurantController.getAllRestaurants);
router.get('/restaurants/nearby', RestaurantController.getNearbyRestaurants);
router.get('/restaurants/search', RestaurantController.searchRestaurants);
router.get('/restaurants/:id', RestaurantController.getRestaurantById);
router.put('/restaurants/:id', authMiddleware, RestaurantController.updateRestaurant);
router.delete('/restaurants/:id', authMiddleware, RestaurantController.deleteRestaurant);
router.patch('/restaurants/:id/location', authMiddleware, RestaurantController.updateLocation);

// ===== PRODUCT ROUTES =====
router.post('/products', authMiddleware, ProductController.createProduct);
router.get('/products', ProductController.getAllProducts);
router.get('/products/search', ProductController.searchProducts);
router.get('/products/restaurant/:restaurantId', ProductController.getProductsByRestaurant);
router.get('/products/:id', ProductController.getProductById);
router.put('/products/:id', authMiddleware, ProductController.updateProduct);
router.delete('/products/:id', authMiddleware, ProductController.deleteProduct);
router.patch('/products/:id/stock', authMiddleware, ProductController.updateStock);

// ===== ORDER ROUTES =====
router.post('/orders', authMiddleware, OrderController.createOrder);
router.get('/orders', authMiddleware, OrderController.getUserOrders);
router.get('/orders/merchant', authMiddleware, OrderController.getMerchantOrders);
router.get('/orders/:id', authMiddleware, OrderController.getOrderById);
router.patch('/orders/:id/status', authMiddleware, OrderController.updateOrderStatus);
router.delete('/orders/:id', authMiddleware, OrderController.cancelOrder);

// ===== REVIEW ROUTES =====
router.post('/reviews', authMiddleware, ReviewController.createReview);
router.get('/reviews/restaurant/:restaurantId', ReviewController.getRestaurantReviews);
router.get('/reviews/:id', ReviewController.getReviewById);
router.put('/reviews/:id', authMiddleware, ReviewController.updateReview);
router.delete('/reviews/:id', authMiddleware, ReviewController.deleteReview);
router.post('/reviews/:id/response', authMiddleware, ReviewController.addMerchantResponse);

module.exports = router;
```

## 4. Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Application
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/marketplace

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# JWT
JWT_SECRET=votre_secret_tres_securise
JWT_REFRESH_SECRET=votre_refresh_secret_tres_securise
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe
EMAIL_FROM=noreply@marketplace.com

# Mapbox
MAPBOX_TOKEN=votre_token_mapbox
```

## 5. Installation des dépendances

Assurez-vous d'avoir installé toutes les dépendances nécessaires :

```bash
npm install express dotenv mongoose redis jsonwebtoken bcryptjs cors helmet morgan compression express-rate-limit express-mongo-sanitize
```

## 6. Démarrage de l'application

Pour démarrer l'application en mode développement :

```bash
npm run dev
```
Pour la production :

```bash
npm start
```

## 7. Tests

Pour exécuter les tests :

```bash
npm test
```

// ============================================
// backend/src/infrastructure/database/mongoose/connection.js
// Connexion MongoDB avec Mongoose
// ============================================
const mongoose = require('mongoose');
const config = require('../../config/environment');

class Database {
constructor() {
this.connection = null;
}

async connect() {
try {
this.connection = await mongoose.connect(
config.database.mongodb.uri,
config.database.mongodb.options
);

      console.log(`✅ MongoDB connecté: ${this.connection.connection.host}`);

      // Gestion des événements
      mongoose.connection.on('error', (err) => {
        console.error('❌ Erreur MongoDB:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB déconnecté');
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error);
      process.exit(1);
    }

}

async disconnect() {
if (this.connection) {
await mongoose.connection.close();
console.log('MongoDB déconnecté proprement');
}
}

async clearDatabase() {
if (config.nodeEnv === 'test') {
const collections = mongoose.connection.collections;
for (const key in collections) {
await collections[key].deleteMany({});
}
}
}
}

module.exports = new Database();

// ============================================
// backend/src/infrastructure/database/redis/client.js
// Client Redis pour cache
// ============================================
const redis = require('redis');
const config = require('../../config/environment');

class RedisClient {
constructor() {
this.client = null;
}

async connect() {
try {
this.client = redis.createClient({
url: config.database.redis.url
});

      this.client.on('error', (err) => {
        console.error('❌ Erreur Redis:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connecté');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Erreur de connexion Redis:', error);
      throw error;
    }

}

async get(key) {
try {
const value = await this.client.get(key);
return value ? JSON.parse(value) : null;
} catch (error) {
console.error('Erreur Redis GET:', error);
return null;
}
}

async set(key, value, ttl = config.database.redis.ttl) {
try {
await this.client.setEx(key, ttl, JSON.stringify(value));
return true;
} catch (error) {
console.error('Erreur Redis SET:', error);
return false;
}
}

async delete(key) {
try {
await this.client.del(key);
return true;
} catch (error) {
console.error('Erreur Redis DELETE:', error);
return false;
}
}

async clear() {
try {
await this.client.flushDb();
return true;
} catch (error) {
console.error('Erreur Redis CLEAR:', error);
return false;
}
}

async disconnect() {
if (this.client) {
await this.client.quit();
console.log('Redis déconnecté proprement');
}
}
}

module.exports = new RedisClient();

// ============================================
// backend/src/infrastructure/server/app.js
// Configuration de l'application Express
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('../config/environment');
const errorHandler = require('../../adapters/middlewares/errorHandler');
const routes = require('./routes');

class App {
constructor() {
this.app = express();
this.setupMiddlewares();
this.setupRoutes();
this.setupErrorHandling();
}

setupMiddlewares() {
// Sécurité
this.app.use(helmet());
this.app.use(cors(config.cors));
this.app.use(mongoSanitize());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Trop de requêtes, veuillez réessayer plus tard.'
    });
    this.app.use('/api', limiter);

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

}

setupRoutes() {
this.app.use('/api', routes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} non trouvée`
      });
    });

}

setupErrorHandling() {
this.app.use(errorHandler);
}

getApp() {
return this.app;
}
}

module.exports = new App().getApp();

// ============================================
// backend/src/infrastructure/server/routes.js
// Définition des routes API
// ============================================
const express = require('express');
const router = express.Router();

// Import des controllers
const UserController = require('../../adapters/controllers/UserController');
const MerchantController = require('../../adapters/controllers/MerchantController');
const RestaurantController = require('../../adapters/controllers/RestaurantController');
const ProductController = require('../../adapters/controllers/ProductController');
const OrderController = require('../../adapters/controllers/OrderController');
const ReviewController = require('../../adapters/controllers/ReviewController');

// Middleware d'authentification
const authMiddleware = require('../../adapters/middlewares/authMiddleware');

// Routes publiques
router.get('/', (req, res) => {
res.json({
message: 'API Marketplace Local',
version: '1.0.0',
endpoints: {
auth: '/api/auth',
restaurants: '/api/restaurants',
products: '/api/products',
orders: '/api/orders',
reviews: '/api/reviews'
}
});
});

// ===== AUTH ROUTES =====
router.post('/auth/register', UserController.register);
router.post('/auth/login', UserController.login);
router.post('/auth/refresh', UserController.refreshToken);
router.post('/auth/logout', authMiddleware, UserController.logout);
router.get('/auth/me', authMiddleware, UserController.getCurrentUser);

// ===== USER ROUTES =====
router.get('/users/:id', authMiddleware, UserController.getUserById);
router.put('/users/:id', authMiddleware, UserController.updateUser);
router.delete('/users/:id', authMiddleware, UserController.deleteUser);

// ===== MERCHANT ROUTES =====
router.post('/merchants/register', MerchantController.registerMerchant);
router.get('/merchants/:id', MerchantController.getMerchantById);
router.put('/merchants/:id', authMiddleware, MerchantController.updateMerchant);
router.get('/merchants/:id/restaurants', MerchantController.getMerchantRestaurants);

// ===== RESTAURANT ROUTES =====
router.post('/restaurants', authMiddleware, RestaurantController.createRestaurant);
router.get('/restaurants', RestaurantController.getAllRestaurants);
router.get('/restaurants/nearby', RestaurantController.getNearbyRestaurants);
router.get('/restaurants/search', RestaurantController.searchRestaurants);
router.get('/restaurants/:id', RestaurantController.getRestaurantById);
router.put('/restaurants/:id', authMiddleware, RestaurantController.updateRestaurant);
router.delete('/restaurants/:id', authMiddleware, RestaurantController.deleteRestaurant);
router.patch('/restaurants/:id/location', authMiddleware, RestaurantController.updateLocation);

// ===== PRODUCT ROUTES =====
router.post('/products', authMiddleware, ProductController.createProduct);
router.get('/products', ProductController.getAllProducts);
router.get('/products/search', ProductController.searchProducts);
router.get('/products/restaurant/:restaurantId', ProductController.getProductsByRestaurant);
router.get('/products/:id', ProductController.getProductById);
router.put('/products/:id', authMiddleware, ProductController.updateProduct);
router.delete('/products/:id', authMiddleware, ProductController.deleteProduct);
router.patch('/products/:id/stock', authMiddleware, ProductController.updateStock);

// ===== ORDER ROUTES =====
router.post('/orders', authMiddleware, OrderController.createOrder);
router.get('/orders', authMiddleware, OrderController.getUserOrders);
router.get('/orders/merchant', authMiddleware, OrderController.getMerchantOrders);
router.get('/orders/:id', authMiddleware, OrderController.getOrderById);
router.patch('/orders/:id/status', authMiddleware, OrderController.updateOrderStatus);
router.delete('/orders/:id', authMiddleware, OrderController.cancelOrder);

// ===== REVIEW ROUTES =====
router.post('/reviews', authMiddleware, ReviewController.createReview);
router.get('/reviews/restaurant/:restaurantId', ReviewController.getRestaurantReviews);
router.get('/reviews/:id', ReviewController.getReviewById);
router.put('/reviews/:id', authMiddleware, ReviewController.updateReview);
router.delete('/reviews/:id', authMiddleware, ReviewController.deleteReview);
router.post('/reviews/:id/response', authMiddleware, ReviewController.addMerchantResponse);

module.exports = router;

// ============================================
// backend/src/index.js
// Point d'entrée de l'application
// ============================================
const app = require('./infrastructure/server/app');
const database = require('./infrastructure/database/mongoose/connection');
const redis = require('./infrastructure/database/redis/client');
const config = require('./infrastructure/config/environment');

class Server {
async start() {
try {
// Connexion à MongoDB
await database.connect();

      // Connexion à Redis
      await redis.connect();

      // Démarrage du serveur
      const server = app.listen(config.port, () => {
        console.log(`

╔═══════════════════════════════════════════╗
║ 🚀 Serveur démarré avec succès! ║
║ 📍 Port: ${config.port}                           ║
║   🌍 Environnement: ${config.nodeEnv}         ║
║   📡 API: http://localhost:${config.port}/api ║
╚═══════════════════════════════════════════╝
`);
});

      // Gestion de l'arrêt gracieux
      process.on('SIGTERM', async () => {
        console.log('⚠️  SIGTERM reçu. Fermeture gracieuse...');
        server.close(async () => {
          await database.disconnect();
          await redis.disconnect();
          process.exit(0);
        });
      });

      process.on('SIGINT', async () => {
        console.log('⚠️  SIGINT reçu. Fermeture gracieuse...');
        server.close(async () => {
          await database.disconnect();
          await redis.disconnect();
          process.exit(0);
        });
      });

    } catch (error) {
      console.error('❌ Erreur lors du démarrage du serveur:', error);
      process.exit(1);
    }

}
}

// Démarrer le serveur
new Server().start();

// ============================================
// backend/src/adapters/middlewares/authMiddleware.js
// Middleware d'authentification JWT
// ============================================
const jwt = require('jsonwebtoken');
const config = require('../../infrastructure/config/environment');
const { User } = require('../../infrastructure/database/mongoose/models/UserModel');

const authMiddleware = async (req, res, next) => {
try {
// Récupérer le token du header
const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();

} catch (error) {
if (error.name === 'JsonWebTokenError') {
return res.status(401).json({
success: false,
message: 'Token invalide'
});
}

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });

}
};

// Middleware pour vérifier le rôle
const authorize = (...roles) => {
return (req, res, next) => {
if (!roles.includes(req.userRole)) {
return res.status(403).json({
success: false,
message: 'Accès non autorisé'
});
}
next();
};
};

module.exports = authMiddleware;
module.exports.authorize = authorize;

// ============================================
// backend/src/adapters/middlewares/errorHandler.js
// Middleware de gestion des erreurs
// ============================================
const config = require('../../infrastructure/config/environment');

class AppError extends Error {
constructor(message, statusCode) {
super(message);
this.statusCode = statusCode;
this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);

}
}

const errorHandler = (err, req, res, next) => {
err.statusCode = err.statusCode || 500;
err.status = err.status || 'error';

if (config.nodeEnv === 'development') {
sendErrorDev(err, res);
} else {
let error = { ...err };
error.message = err.message;

    // Erreur MongoDB de duplication
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      error = new AppError(`Ce ${field} existe déjà`, 400);
    }

    // Erreur de validation Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      error = new AppError(`Données invalides: ${errors.join(', ')}`, 400);
    }

    // Erreur CastError (ID invalide)
    if (err.name === 'CastError') {
      error = new AppError(`ID invalide: ${err.value}`, 400);
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Token invalide', 401);
    }

    if (err.name === 'TokenExpiredError') {
      error = new AppError('Token expiré', 401);
    }

    sendErrorProd(error, res);

}
};

const sendErrorDev = (err, res) => {
res.status(err.statusCode).json({
success: false,
status: err.status,
error: err,
message: err.message,
stack: err.stack
});
};

const sendErrorProd = (err, res) => {
// Erreur opérationnelle : envoyer le message au client
if (err.isOperational) {
res.status(err.statusCode).json({
success: false,
status: err.status,
message: err.message
});
}
// Erreur de programmation : ne pas exposer les détails
else {
console.error('ERROR 💥:', err);
res.status(500).json({
success: false,
status: 'error',
message: 'Une erreur est survenue'
});
}
};

module.exports = errorHandler;
module.exports.AppError = AppError;

// ============================================
// backend/src/adapters/middlewares/validator.js
// Middleware de validation des données
// ============================================
const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const validate = (req, res, next) => {
const errors = validationResult(req);

if (!errors.isEmpty()) {
const errorMessages = errors.array().map(err => ({
field: err.path,
message: err.msg
}));

    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errorMessages
    });

}

next();
};

// Validations pour l'authentification
const validateRegister = [
body('email')
.isEmail()
.withMessage('Email invalide')
.normalizeEmail(),
body('password')
.isLength({ min: 8 })
.withMessage('Le mot de passe doit contenir au moins 8 caractères')
.matches(/^(?=._[a-z])(?=._[A-Z])(?=.\*\d)/)
.withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
body('firstName')
.notEmpty()
.withMessage('Le prénom est requis')
.trim()
.isLength({ min: 2 })
.withMessage('Le prénom doit contenir au moins 2 caractères'),
body('lastName')
.notEmpty()
.withMessage('Le nom est requis')
.trim()
.isLength({ min: 2 })
.withMessage('Le nom doit contenir au moins 2 caractères'),
body('phone')
.optional()
.isMobilePhone()
.withMessage('Numéro de téléphone invalide'),
validate
];

const validateLogin = [
body('email')
.isEmail()
.withMessage('Email invalide')
.normalizeEmail(),
body('password')
.notEmpty()
.withMessage('Le mot de passe est requis'),
validate
];

// Validations pour les restaurants
const validateRestaurant = [
body('name')
.notEmpty()
.withMessage('Le nom est requis')
.trim()
.isLength({ min: 3 })
.withMessage('Le nom doit contenir au moins 3 caractères'),
body('description')
.optional()
.trim()
.isLength({ max: 500 })
.withMessage('La description ne peut pas dépasser 500 caractères'),
body('category')
.notEmpty()
.withMessage('La catégorie est requise')
.isIn(['restaurant', 'cafe', 'bakery', 'grocery', 'butcher', 'pharmacy', 'other'])
.withMessage('Catégorie invalide'),
body('location.coordinates')
.isArray({ min: 2, max: 2 })
.withMessage('Les coordonnées doivent être un tableau [longitude, latitude]'),
body('location.coordinates.\*')
.isFloat()
.withMessage('Les coordonnées doivent être des nombres'),
body('address.street')
.notEmpty()
.withMessage('L\'adresse est requise'),
body('address.city')
.notEmpty()
.withMessage('La ville est requise'),
body('phone')
.notEmpty()
.withMessage('Le téléphone est requis')
.isMobilePhone()
.withMessage('Numéro de téléphone invalide'),
validate
];

// Validations pour les produits
const validateProduct = [
body('name')
.notEmpty()
.withMessage('Le nom est requis')
.trim()
.isLength({ min: 2 })
.withMessage('Le nom doit contenir au moins 2 caractères'),
body('description')
.optional()
.trim()
.isLength({ max: 1000 })
.withMessage('La description ne peut pas dépasser 1000 caractères'),
body('category')
.notEmpty()
.withMessage('La catégorie est requise'),
body('price.amount')
.isFloat({ min: 0 })
.withMessage('Le prix doit être un nombre positif'),
body('restaurant')
.notEmpty()
.withMessage('Le restaurant est requis')
.isMongoId()
.withMessage('ID de restaurant invalide'),
validate
];

// Validation pour les coordonnées GPS
const validateCoordinates = [
query('latitude')
.isFloat({ min: -90, max: 90 })
.withMessage('Latitude invalide'),
query('longitude')
.isFloat({ min: -180, max: 180 })
.withMessage('Longitude invalide'),
query('radius')
.optional()
.isInt({ min: 100, max: 50000 })
.withMessage('Le rayon doit être entre 100m et 50km'),
validate
];

// Validation pour les ID MongoDB
const validateMongoId = [
param('id')
.isMongoId()
.withMessage('ID invalide'),
validate
];

module.exports = {
validate,
validateRegister,
validateLogin,
validateRestaurant,
validateProduct,
validateCoordinates,
validateMongoId
};

// ============================================
// backend/src/adapters/services/AuthService.js
// Service d'authentification
// ============================================
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../infrastructure/config/environment');
const { AppError } = require('../middlewares/errorHandler');

class AuthService {
// Générer un token d'accès
generateAccessToken(userId, role) {
return jwt.sign(
{ userId, role },
config.jwt.secret,
{ expiresIn: config.jwt.expiresIn }
);
}

// Générer un refresh token
generateRefreshToken(userId) {
return jwt.sign(
{ userId },
config.jwt.refreshSecret,
{ expiresIn: config.jwt.refreshExpiresIn }
);
}

// Générer les deux tokens
generateTokens(userId, role) {
return {
accessToken: this.generateAccessToken(userId, role),
refreshToken: this.generateRefreshToken(userId)
};
}

// Vérifier un refresh token
verifyRefreshToken(token) {
try {
return jwt.verify(token, config.jwt.refreshSecret);
} catch (error) {
throw new AppError('Refresh token invalide', 401);
}
}

// Hasher un mot de passe
async hashPassword(password) {
return await bcrypt.hash(password, 12);
}

// Comparer les mots de passe
async comparePasswords(candidatePassword, hashedPassword) {
return await bcrypt.compare(candidatePassword, hashedPassword);
}
}

module.exports = new AuthService();

// ============================================
// backend/package.json
// Configuration npm
// ============================================
{
"name": "marketplace-backend",
"version": "1.0.0",
"description": "API Backend pour Marketplace Local",
"main": "src/index.js",
"scripts": {
"start": "node src/index.js",
"dev": "nodemon src/index.js",
"build": "babel src -d dist",
"test": "jest --coverage",
"test:unit": "jest --testPathPattern=tests/unit",
"test:integration": "jest --testPathPattern=tests/integration",
"test:e2e": "jest --testPathPattern=tests/e2e",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage --coverageReporters=text-lcov > coverage.lcov",
"lint": "eslint src/**/\*.js",
"lint:fix": "eslint src/**/_.js --fix",
"format": "prettier --write \"src/\*\*/_.js\""
},
"keywords": ["marketplace", "api", "nodejs", "express", "mongodb"],
"author": "Your Name",
"license": "MIT",
"dependencies": {
"express": "^4.18.2",
"mongoose": "^8.0.0",
"redis": "^4.6.10",
"bcryptjs": "^2.4.3",
"jsonwebtoken": "^9.0.2",
"cors": "^2.8.5",
"helmet": "^7.1.0",
"morgan": "^1.10.0",
"compression": "^1.7.4",
"express-rate-limit": "^7.1.5",
"express-mongo-sanitize": "^2.2.0",
"express-validator": "^7.0.1",
"dotenv": "^16.3.1",
"cloudinary": "^1.41.0",
"multer": "^1.4.5-lts.1",
"nodemailer": "^6.9.7",
"@mapbox/mapbox-sdk": "^0.15.3"
},
"devDependencies": {
"nodemon": "^3.0.2",
"@babel/cli": "^7.23.4",
"@babel/core": "^7.23.5",
"@babel/preset-env": "^7.23.5",
"jest": "^29.7.0",
"supertest": "^6.3.3",
"eslint": "^8.55.0",
"prettier": "^3.1.1",
"@types/jest": "^29.5.11"
},
"engines": {
"node": ">=20.0.0",
"npm": ">=10.0.0"
}
}

// ============================================
// backend/.env.example
// Exemple de fichier d'environnement
// ============================================

# Environnement

NODE_ENV=development
PORT=5000

# Base de données MongoDB

MONGODB_URI=mongodb://localhost:27017/marketplace

# Redis

REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# JWT

JWT_SECRET=votre-secret-key-tres-securisee-changez-moi
JWT_REFRESH_SECRET=votre-refresh-secret-tres-securisee
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS

CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Cloudinary

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@marketplace.com

# Mapbox

MAPBOX_TOKEN=your_mapbox_token
