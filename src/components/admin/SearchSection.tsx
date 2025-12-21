import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminSearchBar from './AdminSearchBar';
import FloatingSearchButton from './FloatingSearchButton';

interface SearchSectionProps {
  onSearch: () => void;
}

/**
 * Sección de búsqueda que combina la barra de búsqueda y botón flotante
 * Proporciona dos formas de acceder a la búsqueda de ubicaciones
 */
const SearchSection: React.FC<SearchSectionProps> = ({ onSearch }) => {
  return (
    <View style={styles.container}>
      <AdminSearchBar onPress={onSearch} />
      <FloatingSearchButton onPress={onSearch} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default SearchSection;
