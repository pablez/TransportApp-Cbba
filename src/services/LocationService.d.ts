import { Place } from '../types/locations';
import { AutocompleteResult, SearchPlacesResult, OptimalRouteResult, GetCurrentLocationResult } from '../types/locationService';

declare class LocationService {
  static getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number; altitude?: number; timestamp: Date }>;
  static getCurrentLocationWithAddress(): Promise<GetCurrentLocationResult>;
  static searchPlaces(query: string, options?: any): Promise<SearchPlacesResult>;
  static searchPlacesRealTime(query: string, userLocation?: { latitude: number; longitude: number } | null): Promise<SearchPlacesResult>;
  static reverseGeocode(latitude: number, longitude: number): Promise<{ success: boolean; address?: any; error?: string }>;
  static findPlacesByCategory(category: string): Promise<SearchPlacesResult>;
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  static toRadians(degrees: number): number;
  static getAutocompleteSuggestions(input: string): Promise<AutocompleteResult>;
  static isWithinCochabamba(latitude: number, longitude: number): boolean;
  static getOptimalRoute(start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }, profile?: string): Promise<OptimalRouteResult>;
  static decodePolyline(encoded: string): Array<[number, number]>;
  static calculateBounds(coordinates: Array<[number, number]>): { minLng: number; minLat: number; maxLng: number; maxLat: number } | null;
  static calculateStraightDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number;
  static getIsochrones(center: { latitude: number; longitude: number }, timeRanges?: number[], profile?: string): Promise<any>;
}

export default LocationService;
