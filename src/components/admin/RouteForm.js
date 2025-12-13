import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const RouteForm = ({ formData = {}, onChangeField = () => {}, onSelectOnMap = () => {}, onClearPoints = () => {}, onSave = () => {} }) => {
  return (
    <View>
      <Text>Nombre de la línea</Text>
      <TextInput value={formData.name || ''} onChangeText={(t) => onChangeField('name', t)} />

      <Text>Color</Text>
      <TextInput value={formData.color || ''} onChangeText={(t) => onChangeField('color', t)} />

      <TouchableOpacity onPress={onSelectOnMap}>
        <Text>Seleccionar en mapa</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClearPoints}>
        <Text>Limpiar puntos</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSave}>
        <Text>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RouteForm;
