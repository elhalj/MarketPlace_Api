import axios from 'axios';
import { Location } from '../../domain/value-objects/Location';

export class MapService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.MAPS_API_KEY || '';
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error('Geocoding failed');
      }

      const { lat, lng } = response.data.results[0].geometry.location;
      return new Location(lat, lng);
    } catch (error) {
      throw new Error('Failed to geocode address');
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error('Reverse geocoding failed');
      }

      return response.data.results[0].formatted_address;
    } catch (error) {
      throw new Error('Failed to reverse geocode location');
    }
  }

  async calculateDistance(
    origin: Location,
    destination: Location,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<{
    distance: number; // in meters
    duration: number; // in seconds
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: `${origin.latitude},${origin.longitude}`,
          destinations: `${destination.latitude},${destination.longitude}`,
          mode,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error('Distance calculation failed');
      }

      const element = response.data.rows[0].elements[0];
      if (element.status !== 'OK') {
        throw new Error('Route not found');
      }

      return {
        distance: element.distance.value,
        duration: element.duration.value
      };
    } catch (error) {
      throw new Error('Failed to calculate distance');
    }
  }

  async findNearbyRestaurants(
    location: Location,
    radius: number // in meters
  ): Promise<Array<{
    placeId: string;
    name: string;
    address: string;
    location: Location;
    rating?: number;
    userRatingsTotal?: number;
  }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius,
          type: 'restaurant',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error('Nearby search failed');
      }

      return response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        location: new Location(
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total
      }));
    } catch (error) {
      throw new Error('Failed to find nearby restaurants');
    }
  }

  async optimizeDeliveryRoute(
    origin: Location,
    destinations: Location[]
  ): Promise<{
    waypoints: Location[];
    totalDistance: number; // in meters
    totalDuration: number; // in seconds
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${origin.latitude},${origin.longitude}`,
          waypoints: `optimize:true|${destinations.map(d => `${d.latitude},${d.longitude}`).join('|')}`,
          mode: 'driving',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error('Route optimization failed');
      }

      const route = response.data.routes[0];
      const optimizedOrder = route.waypoint_order;
      const optimizedWaypoints = optimizedOrder.map(index => destinations[index]);

      let totalDistance = 0;
      let totalDuration = 0;
      route.legs.forEach(leg => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
      });

      return {
        waypoints: optimizedWaypoints,
        totalDistance,
        totalDuration
      };
    } catch (error) {
      throw new Error('Failed to optimize delivery route');
    }
  }
}
