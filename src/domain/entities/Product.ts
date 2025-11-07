import { Category } from './Category';
import { Price } from '../value-objects/Price';

export class Product {
  constructor(
    private _id: string,
    private _name: string,
    private _description: string,
    private _price: Price,
    private _category: Category,
    private _restaurantId: string,
    private _images: string[],
    private _ingredients: string[],
    private _allergens: string[],
    private _available: boolean = true,
    private _preparationTime: number, // in minutes
    private _rating: number = 0,
    private _totalReviews: number = 0,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get price(): Price {
    return this._price;
  }

  get category(): Category {
    return this._category;
  }

  get restaurantId(): string {
    return this._restaurantId;
  }

  get images(): string[] {
    return this._images;
  }

  get ingredients(): string[] {
    return this._ingredients;
  }

  get allergens(): string[] {
    return this._allergens;
  }

  get available(): boolean {
    return this._available;
  }

  get preparationTime(): number {
    return this._preparationTime;
  }

  get rating(): number {
    return this._rating;
  }

  get totalReviews(): number {
    return this._totalReviews;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters
  set name(name: string) {
    this._name = name;
    this._updatedAt = new Date();
  }

  set description(description: string) {
    this._description = description;
    this._updatedAt = new Date();
  }

  set price(price: Price) {
    this._price = price;
    this._updatedAt = new Date();
  }

  set category(category: Category) {
    this._category = category;
    this._updatedAt = new Date();
  }

  set ingredients(ingredients: string[]) {
    this._ingredients = ingredients;
    this._updatedAt = new Date();
  }

  set allergens(allergens: string[]) {
    this._allergens = allergens;
    this._updatedAt = new Date();
  }

  set preparationTime(time: number) {
    this._preparationTime = time;
    this._updatedAt = new Date();
  }

  // Methods
  updateRating(rating: number): void {
    this._totalReviews++;
    this._rating = ((this._rating * (this._totalReviews - 1)) + rating) / this._totalReviews;
    this._updatedAt = new Date();
  }

  makeAvailable(): void {
    this._available = true;
    this._updatedAt = new Date();
  }

  makeUnavailable(): void {
    this._available = false;
    this._updatedAt = new Date();
  }

  addImage(imageUrl: string): void {
    this._images.push(imageUrl);
    this._updatedAt = new Date();
  }

  removeImage(imageUrl: string): void {
    this._images = this._images.filter(image => image !== imageUrl);
    this._updatedAt = new Date();
  }

  addIngredient(ingredient: string): void {
    if (!this._ingredients.includes(ingredient)) {
      this._ingredients.push(ingredient);
      this._updatedAt = new Date();
    }
  }

  removeIngredient(ingredient: string): void {
    this._ingredients = this._ingredients.filter(ing => ing !== ingredient);
    this._updatedAt = new Date();
  }

  addAllergen(allergen: string): void {
    if (!this._allergens.includes(allergen)) {
      this._allergens.push(allergen);
      this._updatedAt = new Date();
    }
  }

  removeAllergen(allergen: string): void {
    this._allergens = this._allergens.filter(al => al !== allergen);
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      price: this._price.toJSON(),
      category: this._category.toJSON(),
      restaurantId: this._restaurantId,
      images: this._images,
      ingredients: this._ingredients,
      allergens: this._allergens,
      available: this._available,
      preparationTime: this._preparationTime,
      rating: this._rating,
      totalReviews: this._totalReviews,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
