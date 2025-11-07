import { Address } from '../value-objects/Address';
import { Location } from '../value-objects/Location';
import { OpeningHours } from '../value-objects/OpeningHours';
import { Category } from './Category';

export class Restaurant {
  constructor(
    private _id: string,
    private _name: string,
    private _description: string,
    private _address: Address,
    private _location: Location,
    private _phone: string,
    private _categories: Category[],
    private _openingHours: OpeningHours[],
    private _images: string[],
    private _rating: number = 0,
    private _totalReviews: number = 0,
    private _isActive: boolean = true,
    private _merchantId: string,
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

  get address(): Address {
    return this._address;
  }

  get location(): Location {
    return this._location;
  }

  get phone(): string {
    return this._phone;
  }

  get categories(): Category[] {
    return this._categories;
  }

  get openingHours(): OpeningHours[] {
    return this._openingHours;
  }

  get images(): string[] {
    return this._images;
  }

  get rating(): number {
    return this._rating;
  }

  get totalReviews(): number {
    return this._totalReviews;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get merchantId(): string {
    return this._merchantId;
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

  set address(address: Address) {
    this._address = address;
    this._updatedAt = new Date();
  }

  set location(location: Location) {
    this._location = location;
    this._updatedAt = new Date();
  }

  set phone(phone: string) {
    this._phone = phone;
    this._updatedAt = new Date();
  }

  set categories(categories: Category[]) {
    this._categories = categories;
    this._updatedAt = new Date();
  }

  set openingHours(openingHours: OpeningHours[]) {
    this._openingHours = openingHours;
    this._updatedAt = new Date();
  }

  set images(images: string[]) {
    this._images = images;
    this._updatedAt = new Date();
  }

  // Methods
  updateRating(rating: number): void {
    this._totalReviews++;
    this._rating = ((this._rating * (this._totalReviews - 1)) + rating) / this._totalReviews;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  addCategory(category: Category): void {
    this._categories.push(category);
    this._updatedAt = new Date();
  }

  removeCategory(categoryId: string): void {
    this._categories = this._categories.filter(category => category.id !== categoryId);
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

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      address: this._address.toJSON(),
      location: this._location.toJSON(),
      phone: this._phone,
      categories: this._categories.map(category => category.toJSON()),
      openingHours: this._openingHours.map(hours => hours.toJSON()),
      images: this._images,
      rating: this._rating,
      totalReviews: this._totalReviews,
      isActive: this._isActive,
      merchantId: this._merchantId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
