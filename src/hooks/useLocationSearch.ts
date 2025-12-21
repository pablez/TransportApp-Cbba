import { useEffect, useState, useRef } from 'react';
import LocationService from '../services/LocationService';
import { Place, CurrentLocationResult } from '../types/locations';

type UseLocationSearchResult = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Place[];
  suggestions: Array<{ id: string; text: string }>;
  loading: boolean;
  currentLocation: CurrentLocationResult | null;
  selectedCategory: string | null;
  getCurrentLocation: () => Promise<CurrentLocationResult | null>;
  searchPlaces: (query?: string) => Promise<void>;
  getSuggestions: () => Promise<void>;
  searchByCategory: (categoryId: string) => Promise<Place[]>;
  selectSuggestion: (s: { id: string; text: string }) => void;
};

export function useLocationSearch(): UseLocationSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocationResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, Place[]>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // placeholder: caller can invoke getCurrentLocation explicitly
  }, []);

  const getCurrentLocation = async (): Promise<CurrentLocationResult | null> => {
    try {
      const result = await LocationService.getCurrentLocationWithAddress();
      setCurrentLocation(result as CurrentLocationResult);
      return result as CurrentLocationResult;
    } catch (error) {
      console.error('useLocationSearch.getCurrentLocation', error);
      return null;
    }
  };

  const getSuggestions = async () => {
    try {
      const result = await LocationService.getAutocompleteSuggestions(searchQuery);
      if (result?.success) {
        setSuggestions(result.suggestions.slice(0, 5));
      }
    } catch (error) {
      console.error('useLocationSearch.getSuggestions', error);
    }
  };

  const searchPlaces = async (query = searchQuery) => {
    if (!query?.trim()) return;
    setLoading(true);
    try {
      // cache key based on query + rounded user location
      const key = `${query}::${currentLocation?.location?.latitude?.toFixed(5) || 'null'},${currentLocation?.location?.longitude?.toFixed(5) || 'null'}`;
      const cached = cacheRef.current.get(key);
      if (cached) {
        setSearchResults(cached);
        return;
      }
      const result = await LocationService.searchPlaces(query, {
        limit: 20,
        userLocation: currentLocation?.location
      });
      if (result?.success) {
        const places = result.places || [];
        setSearchResults(places);
        try { cacheRef.current.set(key, places); } catch (e) { /* ignore cache errors */ }
      }
    } catch (error) {
      console.error('useLocationSearch.searchPlaces', error);
    } finally {
      setLoading(false);
      setSuggestions([]);
    }
  };

  const debouncedSearchPlaces = (query?: string, delay = 400) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void searchPlaces(query);
    }, delay);
  };

  const searchByCategory = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      const result = await LocationService.findPlacesByCategory(categoryId);
      if (result?.success) {
        setSearchResults(result.places || []);
        return result.places || [];
      }
      return [];
    } catch (error) {
      console.error('useLocationSearch.searchByCategory', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (s: { id: string; text: string }) => {
    setSearchQuery(s.text);
    setSuggestions([]);
    // immediate search for suggestion selection
    void searchPlaces(s.text);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    suggestions,
    loading,
    currentLocation,
    selectedCategory,
    getCurrentLocation,
    searchPlaces,
    getSuggestions,
    searchByCategory,
    selectSuggestion
  };
}

export default useLocationSearch;
