export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface StoreWithDistance {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  distanceKm: number;
  mapsUrl: string;
}

export class GeolocationService {
  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Generate Google Maps deep link for navigation
   */
  generateMapsUrl(destination: { lat: number; lng: number; placeId?: string }): string {
    if (destination.placeId) {
      return `https://www.google.com/maps/dir/?api=1&destination_place_id=${destination.placeId}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
  }

  /**
   * Sort stores by distance from user location
   */
  sortStoresByDistance(
    userLocation: LocationCoordinates,
    stores: Array<{
      id: string;
      name: string;
      address: string;
      lat: string | number;
      lng: string | number;
      placeId?: string;
    }>
  ): StoreWithDistance[] {
    return stores
      .map(store => {
        const storeLat = typeof store.lat === 'string' ? parseFloat(store.lat) : store.lat;
        const storeLng = typeof store.lng === 'string' ? parseFloat(store.lng) : store.lng;
        
        const distanceKm = this.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          storeLat,
          storeLng
        );

        const mapsUrl = this.generateMapsUrl({
          lat: storeLat,
          lng: storeLng,
          placeId: store.placeId
        });

        return {
          id: store.id,
          name: store.name,
          address: store.address,
          lat: storeLat,
          lng: storeLng,
          placeId: store.placeId,
          distanceKm: Math.round(distanceKm * 10) / 10, // Round to 1 decimal place
          mapsUrl
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Check if coordinates are valid
   */
  isValidCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  /**
   * Mock IP geolocation for coverage checking (for MVP)
   * In production, this would integrate with a real IP geolocation service
   */
  mockIpGeolocation(ip: string): { city: string; lat: number; lng: number } {
    // Mock Thailand locations for MVP
    const mockLocations = {
      'bangkok': { city: '曼谷', lat: 13.7563, lng: 100.5018 },
      'chiang_mai': { city: '清迈', lat: 18.7883, lng: 98.9853 },
      'phuket': { city: '普吉', lat: 7.8804, lng: 98.3923 },
    };

    // Simple hash-based selection for consistent results
    const hash = ip.split('.').reduce((acc, num) => acc + parseInt(num), 0);
    const cities = Object.keys(mockLocations);
    const selectedCity = cities[hash % cities.length];
    
    return mockLocations[selectedCity as keyof typeof mockLocations] || mockLocations.bangkok;
  }
}

export const geolocationService = new GeolocationService();
