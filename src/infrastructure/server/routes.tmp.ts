import { Router } from 'express';
import { MerchantController } from '../../adaptaters/controllers/MerchantController';
import { OrderController } from '../../adaptaters/controllers/OrderController';
import { ProductController } from '../../adaptaters/controllers/ProductController';
import { RestaurantController } from '../../adaptaters/controllers/RestaurantController';
import { ReviewController } from '../../adaptaters/controllers/ReviewController';
import { UserController } from '../../adaptaters/controllers/UserController';

import { MongoMerchantRepository } from '../../adaptaters/repositories/MongoMerchantRepository';
import { MongoRestaurantRepository } from '../../adaptaters/repositories/MongoRestaurantRepository';
import { MongoUserRepository } from '../../adaptaters/repositories/MongoUserRepository';

import { EmailService } from '../../adaptaters/services/EmailService';
import { NotificationService } from '../../adaptaters/services/NotificationService';
import { StorageService } from '../../adaptaters/services/StorageService';
import { MapService } from '../../adaptaters/services/MapService';

import { RegisterMerchant } from '../../usecases/merchant/RegisterMerchant';
import { GetMerchantRestaurant } from '../../usecases/merchant/GetMerchantRestaurant';
import { UpdateMerchantProfile } from '../../usecases/merchant/UpdateMerchantProfile';
import { VerifyMerchant } from '../../usecases/merchant/VerifyMerchant';

import { CreateOrder } from '../../usecases/order/CreateOrder';
import { GetMerchantOrder } from '../../usecases/order/GetMerchantOrder';
import { GetOrderByOrder } from '../../usecases/order/GetOrderByOrder';
import { GetUserOrder } from '../../usecases/order/GetUserOrder';
import { UpdateOrderStatus } from '../../usecases/order/UpdateOrderStatus';

import { CreateProduct } from '../../usecases/product/CreateProduct';
import { DeleteProduct } from '../../usecases/product/DeleteProduct';
import { GetProductByRestaurant } from '../../usecases/product/GetProductByRestaurant';
import { SearchProduct } from '../../usecases/product/SearchProduct';
import { UpdateProduct } from '../../usecases/product/UpdateProduct';
import { UpdateProductStock } from '../../usecases/product/UpdateProductStock';

import { CreateRestaurant } from '../../usecases/restaurant/CreateRestaurant';
import { DeleteRestaurant } from '../../usecases/restaurant/DeleteRestaurant';
import { GetNearbyRestaurants } from '../../usecases/restaurant/GetNearbyRestaurants';
import { GetRestaurantById } from '../../usecases/restaurant/GetRestaurantById';
import { SearchRestaurant } from '../../usecases/restaurant/SearchRestaurant';
import { UpdateLocation } from '../../usecases/restaurant/UpdateLocation';
import { UpdateRestaurant } from '../../usecases/restaurant/UpdateRestaurant';
import { authenticate } from '@adaptaters/middlewares/authMiddleware';
import { validator } from '@adaptaters/middlewares/validator';

const router = Router();

// Initialize services
const emailService = new EmailService();
const notificationService = new NotificationService(emailService);
const storageService = new StorageService();
const mapService = new MapService();

// Initialize repositories
const merchantRepository = new MongoMerchantRepository() as unknown as any;
// Lazy-require order/product repositories (some files may export differently or be empty)
let orderRepository: any;
let productRepository: any;
try {
  orderRepository = new (require('../../adaptaters/repositories/MongoOrderRepository').MongoOrderRepository)();
} catch (e) {
  // fallback to a minimal stub to avoid runtime crashes during development
  orderRepository = {} as any;
}
try {
  productRepository = new (require('../../adaptaters/repositories/MongoProductRepository').MongoProductRepository)();
} catch (e) {
  productRepository = {} as any;
}
const restaurantRepository = new MongoRestaurantRepository() as unknown as any;
const userRepository = new MongoUserRepository() as unknown as any;

// Initialize use cases (match constructors)
// Auth service depends on merchant repository
import { AuthService } from '../../adaptaters/services/AuthService';
const authService = new AuthService(emailService, merchantRepository as any);

const merchantUseCases = {
  registerMerchant: new RegisterMerchant(merchantRepository, userRepository, emailService, storageService, authService),
  getMerchantRestaurant: new GetMerchantRestaurant(merchantRepository, restaurantRepository),
  updateMerchantProfile: new UpdateMerchantProfile(merchantRepository, storageService),
  verifyMerchant: new VerifyMerchant(merchantRepository, emailService, notificationService)
};

const orderUseCases = {
  createOrder: new CreateOrder(orderRepository, productRepository, restaurantRepository, notificationService),
  getMerchantOrder: new GetMerchantOrder(orderRepository, merchantRepository),
  getOrderByOrder: new GetOrderByOrder(orderRepository),
  getUserOrder: new GetUserOrder(orderRepository, userRepository),
  updateOrderStatus: new UpdateOrderStatus(orderRepository, notificationService)
};

const productUseCases = {
  createProduct: new CreateProduct(productRepository, restaurantRepository),
  deleteProduct: new DeleteProduct(productRepository, orderRepository, restaurantRepository),
  getProductByRestaurant: new GetProductByRestaurant(productRepository),
  searchProduct: new SearchProduct(productRepository),
  updateProduct: new UpdateProduct(productRepository, restaurantRepository),
  updateProductStock: new UpdateProductStock(productRepository)
};

const restaurantUseCases = {
  createRestaurant: new CreateRestaurant(restaurantRepository, merchantRepository),
  deleteRestaurant: new DeleteRestaurant(restaurantRepository),
  getNearbyRestaurants: new GetNearbyRestaurants(restaurantRepository),
  getRestaurantById: new GetRestaurantById(restaurantRepository),
  searchRestaurant: new SearchRestaurant(restaurantRepository),
  updateLocation: new UpdateLocation(restaurantRepository),
  updateRestaurant: new UpdateRestaurant(restaurantRepository)
};

// Initialize controllers (match controller constructors)
const merchantController = new MerchantController(
  merchantUseCases.registerMerchant,
  merchantUseCases.getMerchantRestaurant,
  merchantUseCases.updateMerchantProfile,
  merchantUseCases.verifyMerchant,
  authService,
  merchantRepository
);
const orderController = new OrderController(
  orderUseCases.createOrder,
  orderUseCases.getOrderByOrder,
  orderUseCases.getUserOrder,
  orderUseCases.getMerchantOrder,
  orderUseCases.updateOrderStatus
);
const productController = new ProductController(
  productUseCases.createProduct,
  productUseCases.updateProduct,
  productUseCases.deleteProduct,
  productUseCases.getProductByRestaurant,
  productUseCases.searchProduct,
  productUseCases.updateProductStock
);
const restaurantController = new RestaurantController(
  restaurantUseCases.createRestaurant,
  restaurantUseCases.getRestaurantById,
  restaurantUseCases.updateRestaurant,
  restaurantUseCases.deleteRestaurant,
  restaurantUseCases.getNearbyRestaurants,
  restaurantUseCases.searchRestaurant,
  restaurantUseCases.updateLocation
);
const reviewController = new ReviewController(
  // lazy require to avoid circular deps if necessary
  new (require('../../usecases/review/CreateReview')).CreateReview(undefined),
  new (require('../../usecases/review/DeleteReview')).DeleteReview(undefined),
  new (require('../../usecases/review/GetRestaurantReview')).GetRestaurantReview(undefined)
);
const userController = new UserController(
  new (require('../../usecases/user/RegisterUser')).RegisterUser(userRepository),
  new (require('../../usecases/user/LoginUser')).LoginUser(userRepository),
  new (require('../../usecases/user/GetUserById')).GetUserById(userRepository),
  new (require('../../usecases/user/UpdateUserProfile')).UpdateUserProfile(userRepository)
);

// Auth routes
router.post('/auth/register', validator('registerUser'), userController.register.bind(userController));
router.post('/auth/login', validator('loginUser'), userController.login.bind(userController));
router.post('/auth/refresh-token', userController.refreshToken.bind(userController));
router.post('/auth/forgot-password', userController.forgotPassword.bind(userController));
router.post('/auth/reset-password', userController.resetPassword.bind(userController));

// User routes
router.get('/users/me', authenticate, userController.getProfile.bind(userController));
router.put('/users/me', authenticate, validator('updateUser'), userController.updateProfile.bind(userController));

// Merchant routes
router.post('/merchants/register', authenticate, validator('registerMerchant'), merchantController.register.bind(merchantController));
router.get('/merchants/restaurants', authenticate, merchantController.getRestaurants.bind(merchantController));
router.put('/merchants/profile', authenticate, validator('updateMerchant'), merchantController.updateProfile.bind(merchantController));
router.patch('/merchants/:id/verify', authenticate, merchantController.verify.bind(merchantController));

// Restaurant routes
router.post('/restaurants', authenticate, validator('createRestaurant'), restaurantController.create.bind(restaurantController));
router.get('/restaurants', restaurantController.search.bind(restaurantController));
router.get('/restaurants/nearby', restaurantController.getNearby.bind(restaurantController));
router.get('/restaurants/:id', restaurantController.getById.bind(restaurantController));
router.put('/restaurants/:id', authenticate, validator('updateRestaurant'), restaurantController.update.bind(restaurantController));
router.patch('/restaurants/:id/location', authenticate, (req, res, next) => (restaurantController as any).updateLocation(req, res, next));
router.delete('/restaurants/:id', authenticate, restaurantController.delete.bind(restaurantController));

// Product routes
router.post('/restaurants/:id/products', authenticate, validator('createProduct'), productController.create.bind(productController));
router.get('/restaurants/:id/products', productController.getByRestaurant.bind(productController));
router.get('/products/search', productController.search.bind(productController));
router.put('/products/:id', authenticate, validator('updateProduct'), productController.update.bind(productController));
router.patch('/products/:id/stock', authenticate, productController.updateStock.bind(productController));
router.delete('/products/:id', authenticate, productController.delete.bind(productController));

// Order routes
router.post('/orders', authenticate, validator('createOrder'), orderController.create.bind(orderController));
router.get('/orders/user', authenticate, orderController.getUserOrders.bind(orderController));
router.get('/orders/merchant', authenticate, orderController.getMerchantOrders.bind(orderController));
router.get('/orders/:id', authenticate, orderController.getById.bind(orderController));
router.patch('/orders/:id/status', authenticate, validator('updateOrderStatus'), orderController.updateStatus.bind(orderController));

// Review routes
router.post('/restaurants/:id/reviews', authenticate, validator('createReview'), reviewController.create.bind(reviewController));
router.get('/restaurants/:id/reviews', reviewController.getRestaurantReviews.bind(reviewController));
router.delete('/reviews/:id', authenticate, reviewController.delete.bind(reviewController));

export default router;