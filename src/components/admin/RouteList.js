import React from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import RouteCard from './RouteCard';

const RouteList = ({
  routes = [],
  onEdit,
  onShow,
  onDelete,
  onShowDetails,
  isTablet = false,
  refreshing = false,
  onRefresh = null,
  onCreate = null,
}) => {
  return (
    <View>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? { paddingVertical: 6 } : undefined}
        contentContainerStyle={{ paddingBottom: 12 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={() => (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#666', marginBottom: 12, fontSize: Math.round(14 * 1.15) }}>No hay líneas aún.</Text>
            {onCreate && (
              <TouchableOpacity onPress={onCreate} style={{ backgroundColor: '#1976D2', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: Math.round(14 * 1.15) }}>Crear primera línea</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ flex: 1, paddingHorizontal: isTablet ? 6 : 3 }}>
            <RouteCard
              route={item}
              onEdit={() => onEdit && onEdit(item)}
              onShow={() => onShow && onShow(item)}
              onDelete={() => onDelete && onDelete(item.id)}
              onShowDetails={() => onShowDetails && onShowDetails(item)}
              isPersisted={!!item.id}
              isTablet={isTablet}
            />
          </View>
        )}
      />
    </View>
  );
};

export default RouteList;
