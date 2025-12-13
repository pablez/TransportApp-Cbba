import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title?: string;
  onOpenMenu?: () => void;
  pendingCount?: number;
};

const AdminLinesHeader: React.FC<Props> = ({ title = 'Administrar Líneas', onOpenMenu, pendingCount = 0 }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton} accessibilityLabel="Abrir menú">
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {pendingCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#1976D2', padding: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
  menuButton: { marginRight: 12 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontWeight: '700', fontSize: 18 },
  badge: { backgroundColor: '#FFA000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '700' }
});

export default AdminLinesHeader;
