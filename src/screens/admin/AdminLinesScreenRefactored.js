import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useIsFocused } from '@react-navigation/native';

// Componentes refactorizados
import ResponsiveLayout, { ResponsiveGrid, ResponsiveRow } from '../../components/layout/ResponsiveLayout';
import ColorSwatch from '../../components/admin/ColorSwatch';
import RouteCard from '../../components/admin/RouteCard';
import PointFormModal from '../../components/admin/PointFormModal';
import { useSnackbar } from '../../components/ui/SnackbarProvider';
import AdminLinesHeader from '../../components/admin/AdminLinesHeader';
import RouteList from '../../components/admin/RouteList';

// Hooks personalizados
import useRouteManagement from '../../hooks/useRouteManagement';
import useRouteForm from '../../hooks/useRouteForm';

// Estilos y constantes
import { adminStyles as styles } from './styles/AdminStyles';
import { COLOR_OPTIONS } from './constants/AdminConstants';

const AdminLinesScreenRefactored = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Hooks personalizados
  const { 
    persistedRoutes, 
    loading, 
    error, 
    saveRoute, 
    updateRoute, 
    deleteRoute 
  } = useRouteManagement();

  const {
    formData,
    editingPointIndex,
    isEditing,
    setEditingPointIndex,
    setIsEditing,
    updateField,
    addPoint,
    updatePoint,
    removePoint,
    clearForm,
    validateForm,
    getFormattedData,
  } = useRouteForm();

  // Animación del FAB
  const fabAnim = useRef(new Animated.Value(isEditing ? 0 : 1)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fabAnim, {
      toValue: isEditing ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isEditing, fabAnim]);

  const triggerFabPulse = (onComplete) => {
    Animated.sequence([
      Animated.timing(fabPulse, { toValue: 1.15, duration: 140, useNativeDriver: true }),
      Animated.timing(fabPulse, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      if (typeof onComplete === 'function') onComplete();
    });
  };

  // Estados locales del UI
  const [showPointModal, setShowPointModal] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [selectedRouteForDetails, setSelectedRouteForDetails] = useState(null);
  const [showRouteDetailsModal, setShowRouteDetailsModal] = useState(false);
  const [markingPublic, setMarkingPublic] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [serverResults, setServerResults] = useState(null);
  // Snackbar from context
  const { showSnackbar } = useSnackbar();

  // Manejar parámetros de navegación
  useEffect(() => {
    if (!isFocused) return;
    
    // Punto seleccionado desde AdminMap
    if (route?.params?.adminMapPoint) {
      const point = route.params.adminMapPoint;
      if (point?.latitude && point?.longitude) {
        setPendingPoint(point);
        setEditingPointIndex(null);
        setShowPointModal(true);
      }
      navigation.setParams({ adminMapPoint: null });
    }

    // Ruta editada desde mapa
    if (route?.params?.adminEditedRoute) {
      const edited = route.params.adminEditedRoute;
      if (edited?.coordinates) {
        const points = edited.coordinates.map(c => ({ 
          latitude: c[1], 
          longitude: c[0] 
        }));
        // Implementar lógica de carga de ruta editada
        Alert.alert('Edición', 'Ruta cargada desde el mapa para continuar la edición');
      }
      navigation.setParams({ adminEditedRoute: null });
    }
  }, [isFocused, route?.params, navigation]);

  // Handlers para el formulario de puntos
  const handleSavePoint = (pointData) => {
    if (!pendingPoint) return;
    
    const newPoint = {
      latitude: pendingPoint.latitude,
      longitude: pendingPoint.longitude,
      street: pointData.street,
      name: pointData.name,
    };

    if (editingPointIndex !== null && editingPointIndex >= 0) {
      updatePoint(editingPointIndex, newPoint);
      Alert.alert('Punto actualizado', `${newPoint.name || 'Punto'} actualizado correctamente`);
    } else {
      addPoint(newPoint);
      Alert.alert('Punto agregado', `${newPoint.name || 'Punto'} agregado correctamente`);
    }

    setShowPointModal(false);
    setPendingPoint(null);
    setEditingPointIndex(null);
  };

  const handleViewPointOnMap = (pointData) => {
    if (!pendingPoint) return;
    
    const coords = [[pendingPoint.longitude, pendingPoint.latitude]];
    setShowPointModal(false);
    
    navigation.navigate('EditMap', {
      customRoute: {
        coordinates: coords,
        color: formData.color,
        name: pointData.name || 'Punto'
      },
      returnTo: 'AdminLines'
    });
  };

  // Handlers para rutas
  const handleSaveRoute = async () => {
    if (!validateForm()) return;

    const routeData = getFormattedData();
    const result = await saveRoute(routeData);

    if (result.success) {
      navigation.navigate('AdminMap', {
        customRoute: {
          coordinates: routeData.coordsPairs,
          color: routeData.color,
          name: routeData.name
        }
      });
      clearForm();
      showSnackbar('Ruta guardada correctamente');
    } else {
      Alert.alert('Error', 'No se pudo guardar la ruta: ' + result.error);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    const deleted = await deleteRoute(routeId);
    if (deleted) {
      Alert.alert('Éxito', 'Ruta eliminada correctamente');
      showSnackbar('Ruta eliminada');
    }
  };

  // Marcar todas las rutas como públicas
  const markAllPublic = () => {
    if (!persistedRoutes || persistedRoutes.length === 0) {
      Alert.alert('Info', 'No hay rutas para marcar.');
      return;
    }

    Alert.alert(
      'Marcar todas como públicas',
      '¿Deseas marcar todas las rutas como públicas? Esta acción se aplicará a todas las rutas existentes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setMarkingPublic(true);
              const updates = persistedRoutes.map(r => {
                if (r.public) return Promise.resolve({ success: true });
                return updateRoute(r.id, { public: true });
              });
              const results = await Promise.all(updates);
              const failed = results.filter(r => r && r.success === false).length;
              setMarkingPublic(false);
              if (failed === 0) {
                Alert.alert('Éxito', 'Todas las rutas fueron marcadas como públicas.');
              } else {
                Alert.alert('Parcial', `${failed} actualizaciones fallaron.`);
              }
            } catch (err) {
              console.error('Error marking public:', err);
              setMarkingPublic(false);
              Alert.alert('Error', 'No se pudieron marcar las rutas: ' + (err.message || err));
            }
          }
        }
      ]
    );
  };

  // Pull-to-refresh: fetch snapshot once (onSnapshot keeps list live)
  const refreshRoutes = async () => {
    try {
      setRefreshing(true);
      const q = query(collection(db, 'routes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      // onSnapshot will update persistedRoutes; we just ensure we fetched
      // refresh server-side filtered results as well
      await fetchServerRoutes();
      setRefreshing(false);
    } catch (err) {
      console.error('Error refreshing routes:', err);
      setRefreshing(false);
    }
  };

  // Fetch filtered results from server when filterMode or sortBy changes (optimize large lists)
  const fetchServerRoutes = async () => {
    try {
      let qRef = collection(db, 'routes');
      const clauses = [];
      if (filterMode === 'public') {
        clauses.push(['public', '==', true]);
      } else if (filterMode === 'private') {
        clauses.push(['public', '==', false]);
      }

      // Build query with where clauses
      let q;
      if (clauses.length > 0) {
        // apply first where, then additional where via chaining
        q = query(qRef, clauses.map(c => (c)));
      } else {
        q = query(qRef);
      }

      // Apply ordering
      if (sortBy === 'name') {
        q = query(q, orderBy('name', 'asc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setServerResults(results);
    } catch (err) {
      console.error('Error fetching server routes:', err);
      setServerResults(null);
    }
  };

  useEffect(() => {
    // Fetch server results when filter or sort changes
    fetchServerRoutes();
  }, [filterMode, sortBy]);

  // Fetch server results on mount
  useEffect(() => {
    fetchServerRoutes();
  }, []);

  // Filtrado y ordenamiento local de rutas
  const filteredRoutes = React.useMemo(() => {
    const source = serverResults || persistedRoutes;
    if (!source) return [];
    const q = (source || []).slice();

    const search = (searchValue || '').trim().toLowerCase();
    let res = q.filter(r => {
      if (search) {
        const name = (r.name || '').toString().toLowerCase();
        if (!name.includes(search)) return false;
      }
      if (filterMode === 'public') return !!r.public;
      if (filterMode === 'private') return !r.public;
      return true;
    });

    if (sortBy === 'name') {
      res.sort((a, b) => (a.name || '').toString().localeCompare((b.name || '').toString()));
    } else {
      // createdAt desc
      res.sort((a, b) => {
        const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
        const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        return tb - ta;
      });
    }

    return res;
  }, [persistedRoutes, searchValue, filterMode, sortBy]);

  // Convertir coordenadas para compatibilidad
  const convertCoordsToPairs = (coords) => {
    if (!coords) return [];
    if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
      return coords;
    }
    return coords.map(c => [c.lng, c.lat]);
  };

  // Renderizado condicional basado en estado
  if (loading) {
    return (
      <ResponsiveLayout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1976D2" accessible={true} accessibilityLabel="Cargando rutas" />
          <Text style={styles.loadingText}>Cargando rutas...</Text>
        </View>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()} accessible={true} accessibilityRole="button" accessibilityLabel="Reintentar" accessibilityHint="Vuelve a intentar cargar las rutas">
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      {/* Header principal via component */}
      <AdminLinesHeader
        onOpenMenu={() => navigation.openDrawer && navigation.openDrawer()}
        title="Administrar Líneas"
        onMarkAllPublic={() => markAllPublic()}
        marking={markingPublic}
        searchValue={searchValue}
        onSearchChange={(v) => setSearchValue(v)}
        filter={filterMode}
        onFilterChange={(f) => setFilterMode(f)}
        sort={sortBy}
        onSortChange={(s) => setSortBy(s)}
        totalCount={(persistedRoutes || []).length}
      />

      {!isEditing ? (
        <View style={{ flex: 1, paddingVertical: isTablet ? 12 : 8, paddingHorizontal: isTablet ? 20 : 10 }}>
            <View style={{ flex: 1, width: '100%', maxWidth: isTablet ? 1000 : '100%', alignSelf: 'center', justifyContent: 'flex-start' }}>
              {/* Vista de lista de rutas (delegada a RouteList) */}
              <View style={styles.listContainer}>
                <View style={{ height: isTablet ? 8 : 6 }} />

                <View style={{ flex: 1 }}>
                <RouteList
                  routes={filteredRoutes}
                  isTablet={isTablet}
                  refreshing={refreshing}
                  onRefresh={refreshRoutes}
                  onCreate={() => { clearForm(); triggerFabPulse(() => setIsEditing(true)); }}
                  onEdit={(item) => {
                    const coords = convertCoordsToPairs(item.coordinates);
                    navigation.navigate('EditMap', {
                      editMode: true,
                      editableRoute: {
                        id: item.id,
                        coordinates: coords,
                        name: item.name,
                        color: item.color
                      },
                      returnTo: 'AdminLines'
                    });
                  }}
                  onShow={(item) => {
                    let coords = convertCoordsToPairs(item.coordinates || []);

                    // Normalizar a [lng, lat] si es necesario (heurística por magnitud)
                    if (coords && coords.length > 0 && Array.isArray(coords[0])) {
                      const sample = coords.slice(0, Math.min(coords.length, 10));
                      const avgAbs0 = sample.reduce((s, c) => s + Math.abs(Number(c[0]) || 0), 0) / sample.length;
                      const avgAbs1 = sample.reduce((s, c) => s + Math.abs(Number(c[1]) || 0), 0) / sample.length;
                      // Si la primera componente tiene magnitud menor en promedio, es probable que sea latitud -> swap
                      if (avgAbs0 < avgAbs1) {
                        coords = coords.map(c => [c[1], c[0]]);
                      }
                    }

                    navigation.navigate('AdminMap', {
                      customRoute: {
                        coordinates: coords,
                        color: item.color,
                        name: item.name
                      }
                    });
                  }}
                  onDelete={(id) => handleDeleteRoute(id)}
                  onShowDetails={(item) => {
                    setSelectedRouteForDetails(item);
                    setShowRouteDetailsModal(true);
                  }}
                  // search & filter handlers passed for convenience
                  searchValue={searchValue}
                  onSearchChange={(v) => setSearchValue(v)}
                  onFilterChange={(f) => setFilterMode(f)}
                  sort={sortBy}
                  onSortChange={(s) => setSortBy(s)}
                />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: isTablet ? 12 : 8, paddingHorizontal: isTablet ? 20 : 10 }} keyboardShouldPersistTaps="handled">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >

            <View style={{ flex: 1, width: '100%', maxWidth: isTablet ? 1000 : '100%', alignSelf: 'center' }}>
              {/* Vista de formulario de edición */}
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <Text style={[styles.formTitle, { fontSize: isTablet ? 22 : 18 }]}>
                    {formData.name ? `Editando: ${formData.name}` : 'Nueva Línea'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.formCloseButton}
                    onPress={() => {
                      Alert.alert(
                        'Cancelar edición',
                        '¿Estás seguro? Se perderán los cambios no guardados.',
                        [
                          { text: 'Continuar editando', style: 'cancel' },
                          { text: 'Cancelar', style: 'destructive', onPress: clearForm }
                        ]
                      );
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Formulario */}
                <View style={styles.form}>
                  <Text style={styles.inputLabel}>Nombre de la línea</Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => updateField('name', text)}
                    placeholder="Ej: Línea 150"
                    style={[styles.input, { fontSize: isTablet ? 16 : 14 }]}
                    autoCapitalize="words"
                  />

                  <Text style={styles.inputLabel}>Seleccionar color</Text>
                  <ResponsiveGrid columns={{ mobile: 4, tablet: 6, desktop: 8 }}>
                    {COLOR_OPTIONS.map(color => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={formData.color === color}
                        onSelect={(selectedColor) => updateField('color', selectedColor)}
                        size={isTablet ? 'large' : 'medium'}
                      />
                    ))}
                  </ResponsiveGrid>

                  <Text style={styles.inputLabel}>Color personalizado (hex)</Text>
                  <TextInput
                    value={formData.color}
                    onChangeText={(text) => updateField('color', text)}
                    placeholder="#FF5722"
                    style={[styles.input, { fontSize: isTablet ? 16 : 14 }]}
                  />

                  <Text style={styles.inputLabel}>Puntos seleccionados: {formData.points.length}</Text>
                  
                  <ResponsiveRow spacing="medium">
                    <TouchableOpacity 
                      style={[styles.mapButton, { flex: 1 }]}
                      onPress={() => navigation.navigate('AdminMap', { editMode: true, returnTo: 'AdminLines' })}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="location" size={16} color="#fff" />
                      <Text style={styles.mapButtonText}>Seleccionar en mapa</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.clearButton, { flex: 1 }]}
                      onPress={() => updateField('points', [])}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={styles.clearButtonText}>Limpiar puntos</Text>
                    </TouchableOpacity>
                  </ResponsiveRow>

                  {/* Lista de puntos */}
                  {formData.points.length > 0 && (
                    <View style={styles.pointsList}>
                      <Text style={styles.pointsListTitle}>Puntos de la ruta:</Text>
                      {formData.points.map((point, index) => (
                        <View key={`${point.latitude}_${point.longitude}_${index}`} style={styles.pointItem}>
                          <View style={styles.pointInfo}>
                            <Text style={styles.pointName}>{point.name || `Punto ${index + 1}`}</Text>
                            <Text style={styles.pointStreet}>{point.street || 'Sin calle/avenida especificada'}</Text>
                            <Text style={styles.pointCoords}>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</Text>
                          </View>
                          <ResponsiveRow spacing="small">
                            <TouchableOpacity 
                              style={styles.pointEditButton}
                              onPress={() => { setPendingPoint(point); setEditingPointIndex(index); setShowPointModal(true); }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="pencil" size={14} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.pointDeleteButton}
                              onPress={() => removePoint(index)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="trash" size={14} color="#fff" />
                            </TouchableOpacity>
                          </ResponsiveRow>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Botones de acción */}
                  <View style={styles.formActions}>
                    <TouchableOpacity 
                      style={[styles.saveButton, { padding: isTablet ? 16 : 12 }]}
                      onPress={handleSaveRoute}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={[styles.saveButtonText, { fontSize: isTablet ? 16 : 14 }]}>Guardar y Mostrar en Mapa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

            </View>

          </KeyboardAvoidingView>
        </ScrollView>
      )}

      {/* FAB container with floating label on tablet */}
      <View style={styles.fabContainer}>
        {isTablet && (
          <Animated.View
            style={{
              opacity: fabAnim,
              transform: [
                { translateX: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }
              ]
            }}
          >
            <View style={styles.fabLabel}>
              <Text style={styles.fabLabelText}>Crear Nueva Línea</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View
          pointerEvents={isEditing ? 'none' : 'auto'}
          style={[
            styles.floatingButton,
            {
              opacity: fabAnim,
              transform: [
                { scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) },
                { scale: fabPulse }
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => { clearForm(); setIsEditing(true); }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Crear nueva línea"
            accessibilityHint="Abre el formulario para crear una nueva línea"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Modal para formulario de punto */}
      <PointFormModal
        visible={showPointModal}
        onClose={() => {
          setShowPointModal(false);
          setPendingPoint(null);
          setEditingPointIndex(null);
        }}
        onSave={handleSavePoint}
        onViewOnMap={handleViewPointOnMap}
        initialData={editingPointIndex !== null ? formData.points[editingPointIndex] : null}
      />
      {/* Snackbar is provided by SnackbarProvider at app root */}
    </ResponsiveLayout>
  );
};

export default AdminLinesScreenRefactored;