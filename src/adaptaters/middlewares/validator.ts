import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

// Base schemas
const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  postalCode: Joi.string().required()
});

const locationSchema = Joi.object({
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180)
});

const openingHoursSchema = Joi.object({
  day: Joi.string().required().valid(
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
    'FRIDAY', 'SATURDAY', 'SUNDAY'
  ),
  open: Joi.string().required().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  close: Joi.string().required().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

// Validation schemas
const schemas = {
  // User schemas
  registerUser: Joi.object({
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
    phoneNumber: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/)
  }),

  loginUser: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    avatar: Joi.string().uri()
  }),

  // Merchant schemas
  registerMerchant: Joi.object({
    businessName: Joi.string().required().min(2).max(100),
    businessAddress: addressSchema.required(),
    businessRegistrationNumber: Joi.string().required(),
    taxId: Joi.string().required(),
    phoneNumber: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
    email: Joi.string().required().email(),
    documentsUrls: Joi.array().items(Joi.string().uri())
  }),

  updateMerchant: Joi.object({
    businessName: Joi.string().min(2).max(100),
    businessAddress: addressSchema,
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    email: Joi.string().email(),
    documentsUrls: Joi.array().items(Joi.string().uri())
  }),

  // Restaurant schemas
  createRestaurant: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().required().min(10).max(1000),
    address: addressSchema.required(),
    location: locationSchema.required(),
    cuisine: Joi.array().items(Joi.string()).required().min(1),
    priceRange: Joi.string().required().valid('LOW', 'MEDIUM', 'HIGH'),
    openingHours: Joi.array().items(openingHoursSchema).required().min(1),
    imageUrls: Joi.array().items(Joi.string().uri())
  }),

  updateRestaurant: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().min(10).max(1000),
    address: addressSchema,
    location: locationSchema,
    cuisine: Joi.array().items(Joi.string()),
    priceRange: Joi.string().valid('LOW', 'MEDIUM', 'HIGH'),
    openingHours: Joi.array().items(openingHoursSchema),
    imageUrls: Joi.array().items(Joi.string().uri())
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().required().min(10).max(1000),
    price: Joi.number().required().positive(),
    category: Joi.string().required(),
    imageUrls: Joi.array().items(Joi.string().uri()),
    options: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        values: Joi.array().items(
          Joi.object({
            value: Joi.string().required(),
            additionalPrice: Joi.number().min(0)
          })
        ).required()
      })
    ),
    available: Joi.boolean().default(true)
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().min(10).max(1000),
    price: Joi.number().positive(),
    category: Joi.string(),
    imageUrls: Joi.array().items(Joi.string().uri()),
    options: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        values: Joi.array().items(
          Joi.object({
            value: Joi.string().required(),
            additionalPrice: Joi.number().min(0)
          })
        ).required()
      })
    ),
    available: Joi.boolean()
  }),

  // Order schemas
  createOrder: Joi.object({
    restaurantId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().required().integer().min(1),
        selectedOptions: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            value: Joi.string().required()
          })
        )
      })
    ).required().min(1),
    deliveryAddress: addressSchema.required(),
    paymentMethod: Joi.string().required().valid('CARD', 'CASH'),
    notes: Joi.string().max(500)
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().required().valid(
      'CONFIRMED',
      'PREPARING',
      'READY',
      'ON_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    )
  }),

  // Review schemas
  createReview: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().min(10).max(500),
    orderId: Joi.string().required()
  })
};

export const validator = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`);
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new ValidationError(JSON.stringify(validationErrors)));
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};
