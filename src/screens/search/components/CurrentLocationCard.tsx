import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  address?: string;
  onRefresh: () => void;
};

export default function CurrentLocationCard({ address, onRefresh }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name="location" size={20} color="#27ae60" />
      <View style={styles.textWrap}>
        <Text style={styles.title}>Tu ubicación actual:</Text>
        <Text style={styles.address}>{address || 'Sin dirección'}</Text>
      </View>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
        <Ionicons name="refresh" size={18} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  textWrap: { marginLeft: 12, flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#27ae60' },
  address: { fontSize: 12, color: '#666', marginTop: 4 },
  refreshButton: { padding: 8 }
});
