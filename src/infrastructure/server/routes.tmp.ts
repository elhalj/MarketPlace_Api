import { Router } from 'express';
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
const merchantRepository = new MongoMerchantRepository();
const orderRepository = new MongoOrderRepository();
const productRepository = new MongoProductRepository();
const restaurantRepository = new MongoRestaurantRepository();
const userRepository = new MongoUserRepository();

// Initialize use cases
const merchantUseCases = {
  registerMerchant: new RegisterMerchant(merchantRepository, userRepository),
  getMerchantRestaurant: new GetMerchantRestaurant(merchantRepository, restaurantRepository),
  updateMerchantProfile: new UpdateMerchantProfile(merchantRepository, storageService),
  verifyMerchant: new VerifyMerchant(merchantRepository, emailService, notificationService)
};

const orderUseCases = {
  createOrder: new CreateOrder(orderRepository, userRepository, restaurantRepository),
  getMerchantOrder: new GetMerchantOrder(orderRepository),
  getOrderByOrder: new GetOrderByOrder(orderRepository),
  getUserOrder: new GetUserOrder(orderRepository),
  updateOrderStatus: new UpdateOrderStatus(orderRepository, notificationService)
};

const productUseCases = {
  createProduct: new CreateProduct(productRepository, restaurantRepository),
  deleteProduct: new DeleteProduct(productRepository),
  getProductByRestaurant: new GetProductByRestaurant(productRepository),
  searchProduct: new SearchProduct(productRepository),
  updateProduct: new UpdateProduct(productRepository),
  updateProductStock: new UpdateProductStock(productRepository)
};

const restaurantUseCases = {
  createRestaurant: new CreateRestaurant(restaurantRepository, merchantRepository),
  deleteRestaurant: new DeleteRestaurant(restaurantRepository),
  getNearbyRestaurants: new GetNearbyRestaurants(restaurantRepository, mapService),
  getRestaurantById: new GetRestaurantById(restaurantRepository),
  searchRestaurant: new SearchRestaurant(restaurantRepository),
  updateLocation: new UpdateLocation(restaurantRepository, mapService),
  updateRestaurant: new UpdateRestaurant(restaurantRepository)
};

// Initialize controllers
const merchantController = new MerchantController(merchantUseCases);
const orderController = new OrderController(orderUseCases);
const productController = new ProductController(productUseCases);
const restaurantController = new RestaurantController(restaurantUseCases);
const reviewController = new ReviewController();
const userController = new UserController();

// Auth routes
router.post('/auth/register', validate('register'), userController.register);
router.post('/auth/login', validate('login'), userController.login);
router.post('/auth/refresh-token', userController.refreshToken);
router.post('/auth/forgot-password', validate('email'), userController.forgotPassword);
router.post('/auth/reset-password', validate('resetPassword'), userController.resetPassword);

// User routes
router.get('/users/me', authenticate, userController.getProfile);
router.put('/users/me', authenticate, validator('updateProfile'), userController.updateProfile);

// Merchant routes
router.post('/merchants/register', authenticate, validator('merchantRegister'), merchantController.register);
router.get('/merchants/restaurants', authenticate, merchantController.getRestaurants);
router.put('/merchants/profile', authenticate, validator('merchantProfile'), merchantController.updateProfile);
router.patch('/merchants/:id/verify', authenticate, merchantController.verify);

// Restaurant routes
router.post('/restaurants', authenticate, validatr('createRestaurant'), restaurantController.create);
router.get('/restaurants', restaurantController.search);
router.get('/restaurants/nearby', validator('coordinates'), restaurantController.getNearby);
router.get('/restaurants/:id', restaurantController.getById);
router.put('/restaurants/:id', authenticate, validator('updateRestaurant'), restaurantController.update);
router.patch('/restaurants/:id/location', authenticate, validator('location'), restaurantController.updateLocation);
router.delete('/restaurants/:id', authenticate, restaurantController.delete);

// Product routes
router.post('/restaurants/:id/products', authenticate, validator('createProduct'), productController.create);
router.get('/restaurants/:id/products', productController.getByRestaurant);
router.get('/products/search', productController.search);
router.put('/products/:id', authenticate, validator('updateProduct'), productController.update);
router.patch('/products/:id/stock', authenticate, validator('updateStock'), productController.updateStock);
router.delete('/products/:id', authenticate, productController.delete);

// Order routes
router.post('/orders', authenticate, validator('createOrder'), orderController.create);
router.get('/orders/user', authenticate, orderController.getUserOrders);
router.get('/orders/merchant', authenticate, orderController.getMerchantOrders);
router.get('/orders/:id', authenticate, orderController.getById);
router.patch('/orders/:id/status', authenticate, validator('updateOrderStatus'), orderController.updateStatus);

// Review routes
router.post('/restaurants/:id/reviews', authenticate, validator('createReview'), reviewController.create);
router.get('/restaurants/:id/reviews', reviewController.getByRestaurant);
router.delete('/reviews/:id', authenticate, reviewController.delete);

export default router;