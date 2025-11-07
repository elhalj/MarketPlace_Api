export class Address {
  constructor(
    private _street: string,
    private _city: string,
    private _state: string,
    private _country: string,
    private _zipCode: string,
    private _details?: string
  ) {}

  // Getters
  get street(): string {
    return this._street;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get country(): string {
    return this._country;
  }

  get zipCode(): string {
    return this._zipCode;
  }

  get details(): string | undefined {
    return this._details;
  }

  // Methods
  toString(): string {
    const address = `${this._street}, ${this._city}, ${this._state} ${this._zipCode}, ${this._country}`;
    return this._details ? `${address} (${this._details})` : address;
  }

  toJSON() {
    return {
      street: this._street,
      city: this._city,
      state: this._state,
      country: this._country,
      zipCode: this._zipCode,
      details: this._details
    };
  }
}
