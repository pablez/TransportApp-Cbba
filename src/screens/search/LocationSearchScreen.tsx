import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationSearch } from '../../hooks/useLocationSearch';
import SearchBar from './components/SearchBar';
import ResultItem from './components/ResultItem';
import CurrentLocationCard from './components/CurrentLocationCard';
import CategoryGrid from './components/CategoryGrid';
import SuggestionsList from './components/SuggestionsList';
import LocationService from '../../services/LocationService';
import { Place } from '../../types/locations';

type Props = {
  navigation: any;
  route: any;
};

const categories = [
  { id: 'hospitales', name: 'Hospitales', icon: 'medical', color: '#e74c3c' },
  { id: 'universidades', name: 'Universidades', icon: 'school', color: '#3498db' },
  { id: 'bancos', name: 'Bancos', icon: 'card', color: '#f39c12' },
  { id: 'restaurantes', name: 'Restaurantes', icon: 'restaurant', color: '#e67e22' },
  { id: 'farmacias', name: 'Farmacias', icon: 'medical-outline', color: '#27ae60' },
  { id: 'supermercados', name: 'Supermercados', icon: 'storefront', color: '#9b59b6' },
  { id: 'gasolineras', name: 'Gasolineras', icon: 'car', color: '#34495e' },
  { id: 'hoteles', name: 'Hoteles', icon: 'bed', color: '#1abc9c' }
];

const LocationSearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
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
  } = useLocationSearch();

  const { onLocationSelect } = route.params || {};

  useEffect(() => {
    void getCurrentLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const t = setTimeout(() => {
        void getSuggestions();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [searchQuery]);

  const handleSelectLocation = async (place: Place) => {
    if (onLocationSelect) {
      onLocationSelect(place);
      navigation.goBack();
      return;
    }

    if (route.params?.returnScreen) {
      navigation.navigate(route.params.returnScreen, { selectedPlace: place, routeType: route.params?.routeType });
      return;
    }

    let useLocation = currentLocation?.location;
    if (!useLocation) {
      console.log('ℹ️ currentLocation ausente, intentando obtenerla ahora...');
      const obtained = await getCurrentLocation();
      useLocation = obtained?.location || null;
      if (!useLocation) {
        Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
        return;
      }
    }

    try {
      // compute route and navigate; delegate to LocationService
      const routeResult = await LocationService.getOptimalRoute(
        useLocation,
        place.coordinates,
        'driving-car'
      );

      const routeData = {
        origin: { latitude: currentLocation.location.latitude, longitude: currentLocation.location.longitude, name: 'Tu ubicación', address: currentLocation.address?.formatted || 'Ubicación actual' },
        destination: { latitude: place.coordinates.latitude, longitude: place.coordinates.longitude, name: place.name, address: place.label || place.address?.locality || 'Destino' },
        selectedLocation: place,
        showRoute: true,
        routeInfo: routeResult.success ? {
          coordinates: routeResult.coordinates,
          distance: routeResult.distance,
          duration: routeResult.duration,
          steps: routeResult.steps,
          profile: routeResult.profile,
          bounds: routeResult.bounds
        } : null,
        routeError: !routeResult.success ? routeResult.error : null
      };

      console.log('📤 Navegando a AdminMap con params:', {
        origin: routeData.origin,
        destination: routeData.destination,
        showRoute: routeData.showRoute,
        hasRouteInfo: !!routeData.routeInfo
      });
      navigation.navigate('AdminMap', routeData);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo calcular la ruta. Se mostrará una línea recta.');
      const routeData = {
        origin: { latitude: currentLocation.location.latitude, longitude: currentLocation.location.longitude, name: 'Tu ubicación', address: currentLocation.address?.formatted || 'Ubicación actual' },
        destination: { latitude: place.coordinates.latitude, longitude: place.coordinates.longitude, name: place.name, address: place.label || place.address?.locality || 'Destino' },
        selectedLocation: place,
        showRoute: true,
        routeInfo: null,
        routeError: error?.message
      };
      navigation.navigate('AdminMap', routeData);
    }
  };

  const handleSelectCategory = async (categoryId: string) => {
    const places = await searchByCategory(categoryId);
    if (places && places.length > 0) {
      // auto-select first place for convenience
      await handleSelectLocation(places[0]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar Ubicación</Text>
        <TouchableOpacity onPress={getCurrentLocation}>
          <Ionicons name="location" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {currentLocation?.address && (
        <CurrentLocationCard address={currentLocation.address.formatted} onRefresh={getCurrentLocation} />
      )}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={() => void searchPlaces()}
        onClear={() => { setSearchQuery(''); }}
        loading={loading}
      />

      {suggestions.length > 0 && (
        <SuggestionsList suggestions={suggestions as any} onSelect={(s) => selectSuggestion(s)} />
      )}

      {searchResults.length === 0 && suggestions.length === 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Buscar por categoría:</Text>
          <CategoryGrid categories={categories} selectedCategory={selectedCategory} onSelect={(id) => void handleSelectCategory(id)} />
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>{searchResults.length} resultados encontrados:</Text>
          <FlatList data={searchResults} renderItem={({ item }) => (
            <ResultItem place={item as Place} onPress={handleSelectLocation} />
          )} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2196F3', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  currentLocationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  currentLocationText: { marginLeft: 12, flex: 1 },
  currentLocationTitle: { fontSize: 14, fontWeight: '600', color: '#27ae60' },
  currentLocationAddress: { fontSize: 12, color: '#666', marginTop: 4 },
  suggestionsContainer: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8, elevation: 4, maxHeight: 200 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { marginLeft: 12, fontSize: 14, color: '#333' },
  categoriesContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  categoryCard: { flex: 1, alignItems: 'center', backgroundColor: '#fff', margin: 8, padding: 20, borderRadius: 12, borderWidth: 2, elevation: 2 },
  categoryText: { marginTop: 8, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  resultsContainer: { flex: 1, paddingHorizontal: 16 }
});

export default LocationSearchScreen;
