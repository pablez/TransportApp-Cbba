export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  housenumber?: string;
  locality?: string;
  formatted?: string;
}

export interface Place {
  id: string;
  name: string;
  label?: string;
  coordinates: Coordinates;
  address?: Address;
  confidence?: number;
  distance?: number;
  layer?: string;
}

export interface CurrentLocationResult {
  success: boolean;
  location?: Coordinates;
  address?: Address;
}
