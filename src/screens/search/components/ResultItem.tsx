import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../../../types/locations';

type Props = {
  place: Place;
  onPress: (p: Place) => void;
};

export default function ResultItem({ place, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.resultItem} onPress={() => onPress(place)}>
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Ionicons name={place.layer === 'venue' ? 'business' : 'location'} size={20} color="#2196F3" />
          <Text style={styles.resultName}>{place.name}</Text>
        </View>
        <Text style={styles.resultLabel}>{place.label}</Text>
        {place.address?.street && (
          <Text style={styles.resultAddress}>{place.address.street} {place.address.housenumber || ''}</Text>
        )}
        <View style={styles.resultFooter}>
          <Text style={styles.resultConfidence}>Precisión: {Math.round((place.confidence || 0) * 100)}%</Text>
          {place.distance != null && (
            <Text style={styles.resultDistance}>{place.distance < 1 ? `${Math.round(place.distance * 1000)}m` : `${place.distance.toFixed(1)}km`}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
  },
  resultContent: { flex: 1 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  resultName: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#333' },
  resultLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  resultAddress: { fontSize: 12, color: '#888', marginBottom: 8 },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  resultConfidence: { fontSize: 12, color: '#27ae60' },
  resultDistance: { fontSize: 12, color: '#2196F3', fontWeight: '600' }
});
