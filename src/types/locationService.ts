import { Place } from './locations';

export interface AutocompleteSuggestion {
  id: string;
  text: string;
}

export interface AutocompleteResult {
  success: boolean;
  suggestions: AutocompleteSuggestion[];
  error?: string;
}

export interface SearchPlacesResult {
  success: boolean;
  places: Place[];
  error?: string;
}

export type FindByCategoryResult = SearchPlacesResult;

export interface OptimalRouteResult {
  success: boolean;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  distance?: number;
  duration?: number;
  steps?: any[];
  profile?: string;
  bounds?: any;
  error?: string;
}

export interface GetCurrentLocationResult {
  success: boolean;
  location?: { latitude: number; longitude: number };
  address?: any;
  error?: string;
}
