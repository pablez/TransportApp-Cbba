import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading?: boolean;
};

export default function SearchBar({ value, onChangeText, onSubmit, onClear, loading }: Props) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar lugar en Cochabamba..."
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  }
});
