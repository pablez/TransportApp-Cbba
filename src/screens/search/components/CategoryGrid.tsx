import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Category = { id: string; name: string; icon: string; color: string };

type Props = {
  categories: Category[];
  selectedCategory?: string | null;
  onSelect: (id: string) => void;
};

export default function CategoryGrid({ categories, selectedCategory, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { borderColor: item.color }, selectedCategory === item.id && { backgroundColor: item.color + '20' }]}
            onPress={() => onSelect(item.id)}
          >
            <Ionicons name={item.icon as any} size={24} color={item.color} />
            <Text style={[styles.name, { color: item.color }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(i) => i.id}
        numColumns={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  card: { flex: 1, alignItems: 'center', backgroundColor: '#fff', margin: 8, padding: 20, borderRadius: 12, borderWidth: 2, elevation: 2 },
  name: { marginTop: 8, fontSize: 14, fontWeight: '600', textAlign: 'center' }
});
