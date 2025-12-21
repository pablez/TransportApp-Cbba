import React from 'react';
import { FlatList, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutocompleteSuggestion } from '../../../types/locationService';

type Props = {
  suggestions: AutocompleteSuggestion[];
  onSelect: (s: AutocompleteSuggestion) => void;
};

export default function SuggestionsList({ suggestions, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
            <Ionicons name="search" size={16} color="#666" />
            <Text style={styles.text}>{item.text}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8, elevation: 4, maxHeight: 200 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  text: { marginLeft: 12, fontSize: 14, color: '#333' }
});
