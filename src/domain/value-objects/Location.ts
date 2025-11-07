export class Location {
  constructor(
    private _latitude: number,
    private _longitude: number
  ) {
    this.validateCoordinates();
  }

  // Getters
  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  // Methods
  private validateCoordinates(): void {
    if (this._latitude < -90 || this._latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (this._longitude < -180 || this._longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  distanceTo(other: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = this._latitude * Math.PI / 180;
    const lat2 = other.latitude * Math.PI / 180;
    const deltaLat = (other.latitude - this._latitude) * Math.PI / 180;
    const deltaLon = (other.longitude - this._longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toJSON() {
    return {
      latitude: this._latitude,
      longitude: this._longitude
    };
  }
}
