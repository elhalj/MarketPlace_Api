const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'merchant', 'admin'],
    default: 'customer'
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index pour recherche rapide
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
```

## 2. Modèle Restaurant

### Fichier : `src/domain/entities/Restaurant.js`

```javascript
const restaurantSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['restaurant', 'cafe', 'bakery', 'grocery', 'butcher', 'pharmacy', 'other'],
    required: true
  },
  subcategories: [{
    type: String,
    trim: true
  }],
  
  // Localisation
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, required: true, default: 'CI' }
  },
  
  // Contact
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  
  // Horaires d'ouverture
  openingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },
  
  // Images
  coverImage: {
    type: String,
    default: null
  },
  images: [{
    url: String,
    publicId: String
  }],
  
  // Statistiques
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  
  // Statut
  isOpen: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Métadonnées
  tags: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    enum: ['delivery', 'takeaway', 'wifi', 'parking', 'terrace', 'accessible']
  }]
}, {
  timestamps: true
});

// Index géospatial pour recherche par proximité
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ merchant: 1 });
restaurantSchema.index({ category: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
```

## 3. Modèle Produit (Product)

### Fichier : `src/domain/entities/Product.js`

```javascript
const productSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Prix
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'XOF' // Franc CFA
    }
  },
  
  // Prix promotionnel
  discountPrice: {
    amount: { type: Number, min: 0 },
    startDate: Date,
    endDate: Date
  },
  
  // Images
  images: [{
    url: String,
    publicId: String
  }],
  mainImage: {
    type: String,
    default: null
  },
  
  // Stock et disponibilité
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: null // null = stock illimité
  },
  
  // Caractéristiques
  unit: {
    type: String,
    enum: ['piece', 'kg', 'g', 'l', 'ml', 'portion'],
    default: 'piece'
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  
  // Métadonnées
  tags: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  // Statut
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Statistiques
  views: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index
productSchema.index({ restaurant: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'price.amount': 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ inStock: 1, isAvailable: 1 });

const Product = mongoose.model('Product', productSchema);
```

## 4. Modèle Commande (Order)

### Fichier : `src/domain/entities/Order.js`

```javascript
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  // Articles commandés
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      amount: Number,
      currency: String
    },
    subtotal: Number
  }],
  
  // Montants
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Livraison
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    }
  },
  deliveryType: {
    type: String,
    enum: ['delivery', 'takeaway'],
    required: true
  },
  
  // Statut
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Paiement
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: Date,
  
  // Notes
  customerNote: String,
  merchantNote: String,
  
  // Historique des statuts
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  
  // Estimation
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date
}, {
  timestamps: true
});

// Générer un numéro de commande unique
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Index
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
```

## 5. Modèle Avis (Review)

### Fichier : `src/domain/entities/Review.js`

```javascript
const reviewSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Note
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Détails de la note
  ratings: {
    food: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    ambiance: { type: Number, min: 1, max: 5 },
    priceQuality: { type: Number, min: 1, max: 5 }
  },
  
  // Commentaire
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Images
  images: [{
    url: String,
    publicId: String
  }],
  
  // Réponse du marchand
  merchantResponse: {
    text: String,
    respondedAt: Date
  },
  
  // Statut
  isVerified: {
    type: Boolean,
    default: false // Vérifié = commande confirmée
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Utilité
  helpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Un client ne peut laisser qu'un seul avis par restaurant
reviewSchema.index({ restaurant: 1, customer: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, rating: -1 });
reviewSchema.index({ customer: 1 });

const Review = mongoose.model('Review', reviewSchema);
```

## 6. Modèle Catégorie (Category)

### Fichier : `src/domain/entities/Category.js`

```javascript
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  image: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });

const Category = mongoose.model('Category', categorySchema);
```

## 7. Exports des modèles

### Fichier : `src/domain/entities/index.js`

```javascript
const User = require('./User');
const Restaurant = require('./Restaurant');
const Product = require('./Product');
const Order = require('./Order');
const Review = require('./Review');
const Category = require('./Category');

module.exports = {
  User,
  Restaurant,
  Product,
  Order,
  Review,
  Category
};
