export type Point = {
  latitude: number;
  longitude: number;
  street?: string;
  name?: string;
};

export type CoordObject = { lng: number; lat: number };

export type RouteItem = {
  id?: string;
  name: string;
  color?: string;
  coordinates: CoordObject[];
  points?: Point[];
  createdBy?: string;
  createdAt?: any;
  public?: boolean;
};
