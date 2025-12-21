import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TileStyles, TileStyleKey } from '../../types/admin';

interface TileLayerSelectorProps {
  mapStyle: TileStyleKey;
  onChangeTileLayer: (styleKey: TileStyleKey) => void;
}

export const TILE_STYLES: TileStyles = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© OpenStreetMap contributors'
  },
    cyclo: {
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors — CyclOSM'
    },
  transport: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors & CARTO'
  }
};

/**
 * Componente para cambiar el tipo de capa de tiles del mapa
 * Maneja los estilos visuales del mapa (standard, ciclismo, transporte)
 */
const TileLayerSelector: React.FC<TileLayerSelectorProps> = ({
  mapStyle,
  onChangeTileLayer,
}) => {
  const handleTileChange = (styleKey: TileStyleKey) => {
    onChangeTileLayer(styleKey);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.mapTypeButton, mapStyle === 'standard' && styles.mapTypeButtonActive]} onPress={() => handleTileChange('standard')}>
        <Text style={[styles.mapTypeText, mapStyle === 'standard' && styles.mapTypeTextActive]}>Estándar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.mapTypeButton, mapStyle === 'cyclo' && styles.mapTypeButtonActive]} onPress={() => handleTileChange('cyclo')}>
        <Text style={[styles.mapTypeText, mapStyle === 'cyclo' && styles.mapTypeTextActive]}>Ciclista</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.mapTypeButton, mapStyle === 'transport' && styles.mapTypeButtonActive]} onPress={() => handleTileChange('transport')}>
        <Text style={[styles.mapTypeText, mapStyle === 'transport' && styles.mapTypeTextActive]}>Transporte</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  mapTypeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  mapTypeButtonActive: {
    backgroundColor: '#1976D2',
  },
  mapTypeText: {
    color: '#333',
    fontWeight: '600',
  },
  mapTypeTextActive: {
    color: '#fff'
  },
});

export default TileLayerSelector;
