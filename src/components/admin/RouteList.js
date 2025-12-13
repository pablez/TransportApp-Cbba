import React from 'react';
import { View, FlatList } from 'react-native';
import RouteCard from './RouteCard';

const RouteList = ({ routes = [], onEdit, onShow, onDelete, onShowDetails }) => {
  return (
    <View>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RouteCard
            route={item}
            onEdit={() => onEdit && onEdit(item)}
            onShow={() => onShow && onShow(item)}
            onDelete={() => onDelete && onDelete(item.id)}
            onShowDetails={() => onShowDetails && onShowDetails(item)}
            isPersisted={!!item.id}
          />
        )}
      />
    </View>
  );
};

export default RouteList;
