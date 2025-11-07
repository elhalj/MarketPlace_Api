import { Address } from '../value-objects/Address';

export class Merchant {
  constructor(
    private _id: string,
    private _businessName: string,
    private _businessAddress: Address,
    private _businessRegistrationNumber: string,
    private _taxId: string,
    private _phoneNumber: string,
    private _email: string,
    private _password: string,
    private _documentsUrls: string[],
    private _isVerified: boolean = false,
    private _status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' = 'PENDING',
    private _role: string = 'merchant',
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get businessName(): string {
    return this._businessName;
  }

  get businessAddress(): Address {
    return this._businessAddress;
  }

  get businessRegistrationNumber(): string {
    return this._businessRegistrationNumber;
  }

  get taxId(): string {
    return this._taxId;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get documentsUrls(): string[] {
    return this._documentsUrls;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get status(): 'PENDING' | 'ACTIVE' | 'SUSPENDED' {
    return this._status;
  }

  get role(): string {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters
  set businessName(name: string) {
    this._businessName = name;
    this._updatedAt = new Date();
  }

  set businessAddress(address: Address) {
    this._businessAddress = address;
    this._updatedAt = new Date();
  }

  set phoneNumber(phone: string) {
    this._phoneNumber = phone;
    this._updatedAt = new Date();
  }

  set email(email: string) {
    this._email = email;
    this._updatedAt = new Date();
  }

  // Methods
  verify(): void {
    this._isVerified = true;
    if (this._status === 'PENDING') {
      this._status = 'ACTIVE';
    }
    this._updatedAt = new Date();
  }

  activate(): void {
    if (!this._isVerified) {
      throw new Error('Cannot activate unverified merchant');
    }
    this._status = 'ACTIVE';
    this._updatedAt = new Date();
  }

  suspend(): void {
    this._status = 'SUSPENDED';
    this._updatedAt = new Date();
  }

  addDocument(documentUrl: string): void {
    this._documentsUrls.push(documentUrl);
    this._updatedAt = new Date();
  }

  removeDocument(documentUrl: string): void {
    this._documentsUrls = this._documentsUrls.filter(url => url !== documentUrl);
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      businessName: this._businessName,
      businessAddress: this._businessAddress.toJSON(),
      businessRegistrationNumber: this._businessRegistrationNumber,
      taxId: this._taxId,
      phoneNumber: this._phoneNumber,
      email: this._email,
      documentsUrls: this._documentsUrls,
      isVerified: this._isVerified,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
