import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props { onPress: () => void }

const FloatingSearchButton: React.FC<Props> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.floatingSearchButton}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Buscar ubicación"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.floatingButtonContent}>
        <Ionicons name="search-circle" size={28} color="#fff" />
        <Text style={styles.floatingButtonText}>Buscar</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingSearchButton: {
    position: 'absolute',
    top: 872,
    left: 20,
    backgroundColor: '#FF5722',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 99999,
  },
  floatingButtonContent: { flexDirection: 'row', alignItems: 'center' },
  floatingButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 6 },
});

export default FloatingSearchButton;
