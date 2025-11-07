export class Review {
  constructor(
    private _id: string,
    private _userId: string,
    private _restaurantId: string,
    private _orderId: string,
    private _rating: number,
    private _comment: string,
    private _images: string[] = [],
    private _isVerified: boolean = false,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {
    this.validateRating();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get restaurantId(): string {
    return this._restaurantId;
  }

  get orderId(): string {
    return this._orderId;
  }

  get rating(): number {
    return this._rating;
  }

  get comment(): string {
    return this._comment;
  }

  get images(): string[] {
    return this._images;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Methods
  private validateRating(): void {
    if (this._rating < 1 || this._rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  verify(): void {
    this._isVerified = true;
    this._updatedAt = new Date();
  }

  updateComment(comment: string): void {
    this._comment = comment;
    this._updatedAt = new Date();
  }

  updateRating(rating: number): void {
    this._rating = rating;
    this.validateRating();
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
      userId: this._userId,
      restaurantId: this._restaurantId,
      orderId: this._orderId,
      rating: this._rating,
      comment: this._comment,
      images: this._images,
      isVerified: this._isVerified,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
