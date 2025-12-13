import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const PointsList = ({ points = [], onEditPoint, onRemovePoint }) => {
  if (!points || points.length === 0) return null;

  return (
    <View>
      {points.map((p, i) => (
        <View key={`${p.latitude}_${p.longitude}_${i}`} style={{ paddingVertical: 6 }}>
          <Text>{p.name || `Punto ${i + 1}`}</Text>
          <Text>{p.street || 'Sin calle'}</Text>
          <Text>{p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => onEditPoint && onEditPoint(i)}>
              <Text>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onRemovePoint && onRemovePoint(i)}>
              <Text>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export default PointsList;
