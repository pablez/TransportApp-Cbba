import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PixelRatio, Alert } from 'react-native';
import { FONT_MULTIPLIER } from '../../screens/admin/styles/AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import OverflowMenu from './OverflowMenu';

const RouteCard = ({ 
  route, 
  onEdit, 
  onShow, 
  onDelete, 
  onShowDetails,
  isPersisted = true,
  isTablet = false
}) => {
  const isLandscape = isTablet; // keep layout compact on tablet; fallback

  // Escala para dispositivos de alta resolución (coincide con AdminStyles.js)
  const { width, height } = Dimensions.get('window');
  const physicalW = Math.round(width * PixelRatio.get());
  const physicalH = Math.round(height * PixelRatio.get());
  const isHighRes = (physicalW >= 1080 && physicalH >= 1920) || (physicalW >= 1080 && physicalH >= 2400) || (physicalH >= 1080 && physicalW >= 1920);
  const SCALE = isHighRes ? 1.06 : 1;

  const pointsInfo = route.points 
    ? `${route.points.length} puntos con detalles` 
    : `${route.coordinates?.length || 0} puntos`;
  
  const hasDetailedPoints = route.points && route.points.some(p => p.street || p.name);

  const [menuOptions, setMenuOptions] = useState([]);

  // prepare overflow options dynamically
  const buildOptions = () => {
    const opts = [];
    if (onEdit) opts.push({ label: 'Editar', onPress: () => onEdit(route), icon: <Ionicons name="pencil" size={16} color="#333" /> });
    if (onShow) opts.push({ label: 'Mostrar', onPress: () => onShow(route), icon: <Ionicons name="map" size={16} color="#333" /> });
    if (onShowDetails && hasDetailedPoints) opts.push({ label: 'Detalles', onPress: () => onShowDetails(route), icon: <Ionicons name="information-circle" size={16} color="#333" /> });
    if (onDelete && isPersisted) opts.push({ label: 'Eliminar', onPress: () => {
      Alert.alert(
        'Confirmar eliminación',
        `¿Deseas eliminar la ruta "${route.name || 'sin nombre'}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(route.id) }
        ]
      );
    }, icon: <Ionicons name="trash" size={16} color="#b30000" /> });
    return opts;
  };

  React.useEffect(() => {
    setMenuOptions(buildOptions());
  }, [route, isPersisted]);

  return (
    <View
      style={[
      styles.card,
      {
        marginHorizontal: isTablet ? 8 : 4,
        padding: isTablet ? Math.round(14 * SCALE) : Math.round(8 * SCALE),
        minHeight: isTablet ? Math.round(84 * SCALE) : Math.round(64 * SCALE)
      }
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={route && route.name ? `Línea ${route.name}` : 'Línea'}
      accessibilityHint="Acciones disponibles: editar, mostrar o eliminar"
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.colorBox, 
          { 
            backgroundColor: route.color,
            width: isTablet ? 24 : 18,
            height: isTablet ? 24 : 18
          }
        ]} />
        <View style={styles.routeInfo}>
          <Text style={[
            styles.routeName,
            { fontSize: Math.round((isTablet ? 18 : 14) * SCALE * FONT_MULTIPLIER) }
          ]} numberOfLines={1}>
            {route.name}
          </Text>
          <Text style={[
            styles.routeMeta,
            { fontSize: Math.round((isTablet ? 14 : 11) * SCALE * FONT_MULTIPLIER) }
          ]} numberOfLines={1}>
            {pointsInfo}
          </Text>
          {hasDetailedPoints && (
            <View style={styles.detailsBadge}>
              <Ionicons name="checkmark-circle" size={isTablet ? 14 : 12} color="#4CAF50" />
              <Text style={[styles.detailsText, { fontSize: isTablet ? 12 : 11 }]}>Con información de calles</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[
        styles.actions,
        { 
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }
      ]}>
        {isTablet ? (
          // full buttons on tablet
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]} 
              onPress={() => onEdit && onEdit(route)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Editar ruta"
              accessibilityHint="Edita la ruta seleccionada"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil" size={Math.round(16 * SCALE * FONT_MULTIPLIER)} color="#fff" />
              <Text style={[styles.buttonText, { fontSize: Math.round(13 * SCALE * FONT_MULTIPLIER) }]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.showButton]} 
              onPress={() => onShow && onShow(route)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Mostrar ruta en mapa"
              accessibilityHint="Muestra la ruta en el mapa"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="map" size={Math.round(16 * SCALE * FONT_MULTIPLIER)} color="#fff" />
              <Text style={[styles.buttonText, { fontSize: Math.round(13 * SCALE * FONT_MULTIPLIER) }]}>Mostrar</Text>
            </TouchableOpacity>

            {hasDetailedPoints && (
                <TouchableOpacity 
                style={[styles.actionButton, styles.detailsButton]} 
                onPress={() => onShowDetails && onShowDetails(route)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Ver detalles de la ruta"
                accessibilityHint="Muestra detalles de los puntos de la ruta"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="information-circle" size={16} color="#fff" />
                <Text style={[styles.buttonText, { fontSize: 13 }]}>Detalles</Text>
              </TouchableOpacity>
            )}

            {isPersisted && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={() => onDelete && onDelete(route.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Eliminar ruta"
                accessibilityHint="Elimina la ruta permanentemente"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={[styles.buttonText, { fontSize: 13 }]}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          // mobile: only overflow menu to keep card compact
          <OverflowMenu
            options={menuOptions}
            iconSize={20}
            accessibilityLabel="Más acciones de ruta"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginVertical: 6,
    borderRadius: 12,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorBox: {
    borderRadius: 6,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  routeMeta: {
    color: '#666',
    marginBottom: 4,
  },
  detailsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailsText: {
    color: '#4CAF50',
    fontSize: Math.round(11 * FONT_MULTIPLIER),
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  compactIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efefef',
    marginRight: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Math.round(12 * FONT_MULTIPLIER),
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#FFA000',
  },
  showButton: {
    backgroundColor: '#1976D2',
  },
  detailsButton: {
    backgroundColor: '#9C27B0',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
});

export default RouteCard;