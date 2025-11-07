export class Price {
  constructor(
    private _amount: number,
    private _currency: string = 'USD'
  ) {
    this.validateAmount();
    this.validateCurrency();
  }

  // Getters
  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  // Methods
  private validateAmount(): void {
    if (this._amount < 0) {
      throw new Error('Price amount cannot be negative');
    }
    // Ensure amount has maximum 2 decimal places
    if (Math.round(this._amount * 100) / 100 !== this._amount) {
      throw new Error('Price amount cannot have more than 2 decimal places');
    }
  }

  private validateCurrency(): void {
    // Add more currencies as needed
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'MAD'];
    if (!validCurrencies.includes(this._currency)) {
      throw new Error(`Invalid currency. Must be one of: ${validCurrencies.join(', ')}`);
    }
  }

  add(other: Price): Price {
    if (this._currency !== other.currency) {
      throw new Error('Cannot add prices with different currencies');
    }
    return new Price(this._amount + other.amount, this._currency);
  }

  subtract(other: Price): Price {
    if (this._currency !== other.currency) {
      throw new Error('Cannot subtract prices with different currencies');
    }
    return new Price(this._amount - other.amount, this._currency);
  }

  multiply(quantity: number): Price {
    return new Price(this._amount * quantity, this._currency);
  }

  equals(other: Price): boolean {
    return this._amount === other.amount && this._currency === other.currency;
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }

  toJSON() {
    return {
      amount: this._amount,
      currency: this._currency
    };
  }
}
