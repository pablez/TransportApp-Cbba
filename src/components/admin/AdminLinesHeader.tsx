import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { FONT_MULTIPLIER } from '../../screens/admin/styles/AdminStyles';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title?: string;
  onOpenMenu?: () => void;
  pendingCount?: number;
  onMarkAllPublic?: () => void;
  marking?: boolean;
  // search & filter props
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  filter?: 'all' | 'public' | 'private';
  onFilterChange?: (f: 'all' | 'public' | 'private') => void;
  sort?: 'name' | 'createdAt';
  onSortChange?: (s: 'name' | 'createdAt') => void;
  totalCount?: number;
};

const AdminLinesHeader: React.FC<Props> = ({
  title = 'Administrar Líneas',
  onOpenMenu,
  pendingCount = 0,
  onMarkAllPublic,
  marking = false,
  searchValue = '',
  onSearchChange,
  filter = 'all',
  onFilterChange,
  sort = 'createdAt',
  onSortChange,
  totalCount = 0,
}) => {
  const titleSize = Math.round(18 * FONT_MULTIPLIER);
  const badgeFont = Math.round(12 * FONT_MULTIPLIER);
  const iconSize = Math.round(20 * FONT_MULTIPLIER);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton} accessibilityLabel="Abrir menú">
          <Ionicons name="menu" size={Math.round(24 * FONT_MULTIPLIER)} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {totalCount > 0 && (
            <View style={[styles.badge, { paddingHorizontal: 8 * FONT_MULTIPLIER, paddingVertical: 4 * FONT_MULTIPLIER, marginRight: 8 }]}>
              <Text style={[styles.badgeText, { fontSize: badgeFont }]}>{totalCount}</Text>
            </View>
          )}
          {onMarkAllPublic && (
            <TouchableOpacity onPress={onMarkAllPublic} style={{ marginLeft: 6 }} accessibilityLabel="Marcar todas como públicas">
              {marking ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="globe" size={iconSize} color="#fff" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar por nombre..."
          value={searchValue}
          onChangeText={onSearchChange}
          style={styles.searchInput}
          returnKeyType="search"
        />

        <View style={styles.filterGroup}>
          <TouchableOpacity onPress={() => onFilterChange && onFilterChange('all')} style={[styles.filterButton, filter === 'all' && styles.filterActive]} accessibilityLabel="Filtrar todas">
            <Text style={styles.filterText}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onFilterChange && onFilterChange('public')} style={[styles.filterButton, filter === 'public' && styles.filterActive]} accessibilityLabel="Filtrar públicas">
            <Text style={styles.filterText}>Públicas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onFilterChange && onFilterChange('private')} style={[styles.filterButton, filter === 'private' && styles.filterActive]} accessibilityLabel="Filtrar privadas">
            <Text style={styles.filterText}>Privadas</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onSortChange && onSortChange(sort === 'name' ? 'createdAt' : 'name')} style={styles.sortButton} accessibilityLabel="Ordenar">
          <Ionicons name={sort === 'name' ? 'swap-vertical' : 'swap-horizontal'} size={Math.round(18 * FONT_MULTIPLIER)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#1976D2', padding: 12, borderRadius: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuButton: { marginRight: 12 },
  title: { color: '#fff', fontWeight: '700' },
  badge: { backgroundColor: '#FFA000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '700' },

  searchRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  filterGroup: { flexDirection: 'row', alignItems: 'center' },
  filterButton: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginRight: 6, backgroundColor: 'transparent' },
  filterActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  filterText: { color: '#fff', fontWeight: '600' },
  sortButton: { marginLeft: 6 }
});

export default AdminLinesHeader;
