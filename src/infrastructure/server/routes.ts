import { Router } from 'express';
import { authenticate, requireRole } from '../../adaptaters/middlewares/authMiddleware';
import { validate } from '../../adaptaters/middlewares/validator';
import { upload } from '../../adaptaters/middlewares/uploadMiddleware';

import { MerchantController } from '../../adaptaters/controllers/MerchantController';
import { OrderController } from '../../adaptaters/controllers/OrderController';
import { ProductController } from '../../adaptaters/controllers/ProductController';
import { RestaurantController } from '../../adaptaters/controllers/RestaurantController';
import { ReviewController } from '../../adaptaters/controllers/ReviewController';
import { UserController } from '../../adaptaters/controllers/UserController';

import { MongoMerchantRepository } from '../../adaptaters/repositories/MongoMerchantRepository';
import { MongoOrderRepository } from '../../adaptaters/repositories/MongoOrderRepository';
import { MongoProductRepository } from '../../adaptaters/repositories/MongoProductRepository';
import { MongoRestaurantRepository } from '../../adaptaters/repositories/MongoRestaurantRepository';
import { MongoUserRepository } from '../../adaptaters/repositories/MongoUserRepository';

import { AuthService } from '../../adaptaters/services/AuthService';
import { EmailService } from '../../adaptaters/services/EmailService';
import { NotificationService } from '../../adaptaters/services/NotificationService';
import { StorageService } from '../../adaptaters/services/StorageService';
import { MapService } from '../../adaptaters/services/MapService';

// Initialize dependencies
const emailService = new EmailService();
const storageService = new StorageService();
const notificationService = new NotificationService(emailService);
const authService = new AuthService(emailService);

// Initialize repositories
const merchantRepository = new MongoMerchantRepository();
const orderRepository = new MongoOrderRepository();
const productRepository = new MongoProductRepository();
const restaurantRepository = new MongoRestaurantRepository();
const userRepository = new MongoUserRepository();

// Initialize use cases
import { RegisterMerchant } from '../../usecases/merchant/RegisterMerchant';
import { GetMerchantRestaurant } from '../../usecases/merchant/GetMerchantRestaurant';
import { UpdateMerchantProfile } from '../../usecases/merchant/UpdateMerchantProfile';
import { VerifyMerchant } from '../../usecases/merchant/VerifyMerchant';

const registerMerchant = new RegisterMerchant(
  merchantRepository,
  userRepository,
  emailService,
  storageService,
  authService
);

const getMerchantRestaurant = new GetMerchantRestaurant(
  merchantRepository,
  restaurantRepository
);

const updateMerchantProfile = new UpdateMerchantProfile(
  merchantRepository,
  storageService
);

const verifyMerchant = new VerifyMerchant(
  merchantRepository,
  emailService,
  notificationService
);

// Initialize controllers
const merchantController = new MerchantController(
  registerMerchant,
  getMerchantRestaurant,
  updateMerchantProfile,
  verifyMerchant,
  authService,
  merchantRepository
);

const router = Router();

// Authentication routes
router.post('/merchants/register', validate('registerMerchant'), merchantController.register);
router.post('/merchants/login', validate('loginMerchant'), merchantController.login);
router.post('/merchants/refresh-token', merchantController.refreshToken);
router.post('/merchants/logout', merchantController.logout);

// Protected merchant routes
router.get(
  '/merchants/profile',
  authenticate,
  requireRole('merchant'),
  merchantController.getProfile
);

router.patch(
  '/merchants/profile',
  authenticate,
  requireRole('merchant'),
  validate('updateMerchant'),
  merchantController.updateProfile
);

// Admin routes
router.patch(
  '/merchants/:id/verify',
  authenticate,
  requireRole('admin'),
  merchantController.verify
);

// Public routes
router.get(
  '/merchants/:merchantId/restaurants',
  merchantController.getRestaurants
);
router.post('/merchants/:id/verify', authMiddleware, merchantController.verify.bind(merchantController));

export default router;
