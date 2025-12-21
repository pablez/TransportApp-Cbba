// Tipos para la administración de rutas y mapas

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LatLngArray = [number, number];

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface Place {
  coordinates: Coordinates;
  [key: string]: any;
}

export interface RouteInfo {
  name: string;
  description?: string;
  color?: string;
  stops?: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  coordinates?: LatLngArray[] | Coordinates[];
}

export interface CustomRoute {
  coordinates: LatLngArray[] | Coordinates[];
  color?: string;
  name?: string;
  _tileChange?: string;
  [key: string]: any;
}

export interface RouteData {
  origin?: Place;
  destination?: Place;
  routeInfo?: RouteInfo;
  routeError?: string;
  [key: string]: any;
}

export interface AdminMapScreenParams {
  routeType?: string | null;
  editMode?: boolean;
  origin?: Place;
  destination?: Place;
  showRoute?: boolean;
  routeInfo?: RouteInfo;
  routeError?: string;
  selectedPlace?: Place;
  customRoute?: CustomRoute;
  returnTo?: string;
  adminMapPoint?: MapPoint;
}

export interface TileStyle {
  url: string;
  attribution: string;
}

export type TileStyleKey = 'standard' | 'cyclo' | 'transport';

export interface TileStyles {
  [key: string]: TileStyle;
}

export interface WebViewMessage {
  type: 'adminMapPoint' | 'routeDisplayed' | 'detailedRouteDisplayed';
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}
