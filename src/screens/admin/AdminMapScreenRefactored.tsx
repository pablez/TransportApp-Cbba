import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AdminHeader,
  AdminSearchBar,
  AdminMapWebView,
  RouteInfoPanel,
  AdminMapControls,
  FloatingSearchButton,
  useAdminMapLogic,
} from '../../components/admin';
import { useSnackbar } from '../../components/ui/SnackbarProvider';
import { useAuth } from '../../context/AuthContext';
import MapContainer from '../../components/admin/MapContainer';
import SearchSection from '../../components/admin/SearchSection';
import RouteManager from '../../components/admin/RouteManager';
import { TILE_STYLES } from '../../components/admin/TileLayerSelector';
import {
  AdminMapScreenParams,
  Coordinates,
  CustomRoute,
  TileStyleKey,
  MapPoint,
  RouteData,
} from '../../types/admin';

type AdminMapScreenProps = NativeStackScreenProps<any, 'AdminMap'>;

const AdminMapScreen: React.FC<AdminMapScreenProps> = ({ navigation, route }) => {
  const {
    location,
    loading,
    mapReady,
    currentRoute,
    routeData,
    pendingCustomRoute,
    webViewRef,
    setCurrentRoute,
    setRouteData,
    setPendingCustomRoute,
    setMapReady,
    getCurrentLocation,
    updateMapLocation,
    centerOnLocation,
    showTransportRoute,
    showCustomRoute,
    addSearchMarker,
  } = useAdminMapLogic();

  const { user: currentUser } = useAuth() as { user: any };

  const [mapStyle, setMapStyle] = useState<TileStyleKey>('standard');

  const routeType: string | null = (route?.params as AdminMapScreenParams)?.routeType || null;
  const editMode: boolean = (route?.params as AdminMapScreenParams)?.editMode || false;

  useEffect(() => {
    getCurrentLocation();

    if (routeType) setCurrentRoute(routeType);
    if (editMode) console.log('✏️ Modo edición activado en AdminMap');
  }, [routeType, editMode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = route.params as AdminMapScreenParams;

      if (params?.origin && params?.destination && params?.showRoute) {
        setRouteData({
          origin: params.origin,
          destination: params.destination,
          routeInfo: params.routeInfo,
          routeError: params.routeError,
        } as RouteData);

        navigation.setParams({
          origin: null,
          destination: null,
          showRoute: null,
          routeInfo: null,
          routeError: null,
        } as Partial<AdminMapScreenParams>);
        return;
      }

      if (params?.selectedPlace) {
        const place = params.selectedPlace;
        updateMapLocation(place.coordinates.latitude, place.coordinates.longitude);
        addSearchMarker(place);
        navigation.setParams({ selectedPlace: null } as Partial<AdminMapScreenParams>);
      }
    });

    return unsubscribe;
  }, [navigation, mapReady]);

  const changeTileLayer = (styleKey: TileStyleKey): void => {
    const style = TILE_STYLES[styleKey] || TILE_STYLES.standard;
    setMapStyle(styleKey);

    if (webViewRef.current && mapReady) {
      const script = `if(window.setTileLayer) window.setTileLayer("${style.url}", "${style.attribution.replace(/\"/g, '\\\"')}");`;
      try {
        webViewRef.current.postMessage(script);
      } catch (e) {
        console.error('Error enviando setTileLayer:', e);
      }
    } else {
      setPendingCustomRoute((prev: CustomRoute | null) => ({ ...(prev || {}), _tileChange: styleKey }));
    }
  };

  const handleWebViewMessage = (event: any): void => {
    const message = event.nativeEvent.data;
    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.type === 'adminMapPoint') {
        const returnTo = (route?.params as AdminMapScreenParams)?.returnTo || null;
        if (returnTo) {
          navigation.navigate(returnTo, { adminMapPoint: { latitude: parsed.latitude, longitude: parsed.longitude } });
        } else {
          navigation.setParams({ adminMapPoint: { latitude: parsed.latitude, longitude: parsed.longitude } } as Partial<AdminMapScreenParams>);
        }
        return;
      }
      if (parsed && parsed.type === 'routeClicked') {
        const id = parsed.id || null;
        console.log('routeClicked from WebView id=', id);
        setSelectedRouteId(id);
        showSnackbar(`Ruta seleccionada: ${id}`, 2500);
        return;
      }
      if (parsed && (parsed.type === 'routeDisplayed' || parsed.type === 'detailedRouteDisplayed')) {
        return;
      }
    } catch (e) {
      // not json
    }

    if (message === 'mapReady') {
      setMapReady(true);
      if (location) updateMapLocation(location.latitude, location.longitude);
    }
  };

  const handleSearch = (): void => navigation.navigate('LocationSearch');

  const { showSnackbar } = useSnackbar();

  // Estado para manejo de rutas de transporte cargadas y filtro
  const [transportFeatures, setTransportFeatures] = useState<any[]>([]);
  const [transportLoaded, setTransportLoaded] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>({});
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [backupRoutes, setBackupRoutes] = useState<any[] | null>(null);
  const [backupVisibleMap, setBackupVisibleMap] = useState<Record<string, boolean> | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const fetchAndShowRoutesFromFirestore = async (): Promise<void> => {
    if (!webViewRef.current || !mapReady) {
      console.log('fetchAndShowRoutesFromFirestore: webView no listo, abortando');
      return;
    }

    setIsLoadingRoutes(true);
    const telemetryStart = Date.now();
    try {
      // Intentos con backoff exponencial
      const maxAttempts = 3;
      let attempt = 0;
      let snap: any = null;
      while (attempt < maxAttempts) {
        try {
          snap = await getDocs(collection(db, 'routes'));
          console.log('Firestore: routes obtenidas:', snap.size, 'attempt', attempt + 1);
          break;
        } catch (err) {
          attempt += 1;
          console.warn(`Firestore read attempt ${attempt} failed`, err);
          if (attempt >= maxAttempts) throw err;
          const delay = Math.pow(2, attempt) * 300; // ms
          await new Promise((res) => setTimeout(res, delay));
        }
      }

      if (snap.empty) {
        showSnackbar('No se encontraron routes en Firestore', 3000);
        return;
      }

      const allFeatures: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        console.log('Firestore doc:', docSnap.id, 'raw keys:', Object.keys(data));

        let coords: any[] = [];
        if (Array.isArray(data.coordinates) && data.coordinates.length > 0) {
          const first = data.coordinates[0];
          if (first && typeof first === 'object') {
            coords = data.coordinates
              .map((c: any) => {
                const lat = c.latitude ?? c.lat ?? c[1] ?? null;
                const lng = c.longitude ?? c.lng ?? c[0] ?? null;
                return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null;
              })
              .filter(Boolean);
          } else if (Array.isArray(first) && first.length >= 2) {
            coords = data.coordinates.filter((c: any) => Array.isArray(c) && c.length >= 2);
          }
        }

        if (!coords.length && data.geometry && data.geometry.coordinates) {
          coords = data.geometry.coordinates;
        }

        if (coords && coords.length > 0) {
          console.log('Ruta', docSnap.id, 'coordsCount:', coords.length);
          allFeatures.push({
            type: 'Feature',
            properties: { name: data.name || data.title || docSnap.id, color: data.color || '#2196F3', sourceId: docSnap.id },
            geometry: { type: 'LineString', coordinates: coords },
          });
        } else {
          console.log('Ruta', docSnap.id, 'sin coordenadas válidas, omitida');
        }
      });

      if (allFeatures.length > 0) {
        // Enviar todas las rutas directamente al WebView con sus colores individuales
        const script = `
          (function(){
            try {
              if (!window.addTransportRoute) {
                console.error('addTransportRoute no disponible');
                return;
              }
              try { window.clearTransportRoutes(); } catch(e) { console.warn('Error clearing routes', e); }
              const features = ${JSON.stringify(allFeatures)};
              let added = 0;
                features.forEach((f) => {
                try {
                  const coords = (f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : [];
                  const name = (f.properties && f.properties.name) || 'Ruta sin nombre';
                  const color = (f.properties && f.properties.color) || '#2196F3';
                  const sourceId = (f.properties && f.properties.sourceId) || null;
                  if (coords && coords.length > 0) {
                    // pasar sourceId como cuarto parámetro
                    window.addTransportRoute(coords, color, name, sourceId);
                    added += 1;
                    console.log('✅ Ruta agregada:', name, 'id=', sourceId, 'con', coords.length, 'puntos');
                  }
                } catch(err) { 
                  console.warn('Error agregando ruta:', err); 
                }
              });
              console.log('🚌 Total rutas agregadas:', added);
              // no enviar mensaje al RN para evitar notificaciones automáticas
            } catch(e) {
              console.error('Error cargando rutas:', e);
              // enviar errores no es necesario aquí
            }
          })();
        `;
        
        if (webViewRef.current && mapReady) {
          webViewRef.current.postMessage(script);
          console.log(`🚌 Enviando ${allFeatures.length} rutas al WebView`);
        }

        // Guardar en estado para permitir filtrado y toggles
        setTransportFeatures(allFeatures);
        const visibilityMap: Record<string, boolean> = {};
        allFeatures.forEach((f: any, i: number) => {
          const id = (f.properties && f.properties.sourceId) || (f.properties && f.properties.name) || `route_${i}`;
          visibilityMap[id] = true;
          // also ensure the sourceId property exists for later filtering
          if (!f.properties.sourceId) f.properties.sourceId = id;
        });
        setVisibleMap(visibilityMap);
        setTransportLoaded(true);
        // Telemetría: registro exitoso de carga
        try {
          addDoc(collection(db, 'telemetry'), {
            event: 'load_routes',
            success: true,
            routesCount: allFeatures.length,
            durationMs: Date.now() - telemetryStart,
            userId: currentUser?.uid || null,
            timestamp: serverTimestamp()
          }).catch((e) => console.warn('telemetry write failed', e));
        } catch (e) { console.error('telemetry error', e); }

        // Action history (short)
        try {
          addDoc(collection(db, 'action_history'), {
            action: 'load_routes',
            userId: currentUser?.uid || null,
            userEmail: currentUser?.email || null,
            count: allFeatures.length,
            timestamp: serverTimestamp()
          }).catch((e) => console.warn('action_history write failed', e));
        } catch (e) { console.error('action_history error', e); }
      } else {
        showSnackbar('No se encontraron routes válidas en Firestore', 2200);
      }
    } catch (error) {
      console.error('Error leyendo rutas de Firestore:', error);
      // Telemetría: fallo en carga
      try {
        addDoc(collection(db, 'telemetry'), {
          event: 'load_routes',
          success: false,
          error: String(error),
          userId: currentUser?.uid || null,
          timestamp: serverTimestamp()
        }).catch(() => {});
      } catch (e) {}
      showSnackbar('Error cargando rutas', 2200);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const removeAllRoutes = (): void => {
    // Mostrar modal de confirmación
    setShowConfirmRemove(true);
  };

  const confirmRemoveAllRoutes = (): void => {
    if (!webViewRef.current) return;
    // crear backup para permitir deshacer
    setBackupRoutes(transportFeatures);
    setBackupVisibleMap(visibleMap);

    const script = `(function(){try{ if(window.clearTransportRoutes) window.clearTransportRoutes(); }catch(e){console.error(e);} })();`;
    try {
      webViewRef.current.postMessage(script);
    } catch (e) {
      console.error('Error enviando clearTransportRoutes:', e);
    }
    setTransportLoaded(false);
    setTransportFeatures([]);
    setVisibleMap({});
    setShowFilter(false);
    setShowConfirmRemove(false);

    // Registrar auditoría en Firestore
    try {
      const affected = (backupRoutes || []).map((f: any) => (f.properties && f.properties.sourceId) || (f.properties && f.properties.name) || null).filter(Boolean);
      addDoc(collection(db, 'audit_logs'), {
        action: 'remove_all_routes',
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        affectedRouteIds: affected,
        timestamp: serverTimestamp(),
        note: 'Rutas removidas desde interfaz administrativa'
      }).then(() => console.log('Audit log saved')).catch((err) => console.error('Audit log error', err));
    } catch (auditErr) {
      console.error('Error registrando auditoría:', auditErr);
    }

    // Registrar acción en historial y telemetría
    try {
      addDoc(collection(db, 'action_history'), {
        action: 'remove_all_routes',
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        affectedCount: (backupRoutes || []).length,
        timestamp: serverTimestamp()
      }).catch((e) => console.warn('action_history write failed', e));
    } catch (e) { console.error('action_history error', e); }

    try {
      addDoc(collection(db, 'telemetry'), {
        event: 'remove_all_routes',
        success: true,
        affectedCount: (backupRoutes || []).length,
        userId: currentUser?.uid || null,
        timestamp: serverTimestamp()
      }).catch((e) => console.warn('telemetry write failed', e));
    } catch (e) { console.error('telemetry error', e); }
  };

  const renderVisibleRoutes = (): void => {
    if (!webViewRef.current) return;
    try {
      // Enviar toggles de visibilidad por id al WebView usando setRouteVisibility
      try {
        const visibility = visibleMap || {};
        const scriptParts: string[] = [];
        scriptParts.push('(function(){ try {');
        scriptParts.push('  if(!window.setRouteVisibility) { console.warn("setRouteVisibility no disponible"); return; }');
        Object.keys(visibility).forEach((id) => {
          const v = visibility[id] ? 'true' : 'false';
          // proteger nombres con escape
          scriptParts.push(`  try { window.setRouteVisibility("${id}", ${v}); } catch(e) { console.warn('setRouteVisibility error for ${id}', e); }`);
        });
        scriptParts.push('} catch(e) { console.error(e); } })();');
        const script = scriptParts.join('\n');
        webViewRef.current.postMessage(script);
      } catch (e) {
        console.error('Error enviando visibilidad de rutas:', e);
      }
    } catch (e) {
      console.error('Error renderizando rutas visibles:', e);
    }
  };

  // Responder clicks desde WebView para resaltar la ruta y exponer selection
  useEffect(() => {
    if (!webViewRef.current) return;
    // cuando cambia selectedRouteId, pedir al WebView que resalte la ruta
    try {
      const script = `(function(){ try { if(window.setRouteHighlighted) { ${selectedRouteId ? `window.setRouteHighlighted("${selectedRouteId}", true);` : ''} } catch(e){console.error(e);} })();`;
      webViewRef.current.postMessage(script);
    } catch (e) {
      console.error('Error solicitando resaltado de ruta:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId]);

  // Cuando cambia visibleMap, re-renderizar rutas visibles
  useEffect(() => {
    if (transportLoaded) renderVisibleRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMap]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>🔍 Obteniendo ubicación GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1976D2" barStyle="light-content" />

      <AdminHeader currentRoute={currentRoute} onCloseRoute={() => setCurrentRoute(null)} />

      <SearchSection onSearch={handleSearch} />

      <View style={styles.controlsContainer}>
        <RouteManager
          currentRoute={currentRoute}
          routeData={routeData}
          pendingCustomRoute={pendingCustomRoute}
          mapReady={mapReady}
          webViewRef={webViewRef}
          onCurrentRouteChange={setCurrentRoute}
          onRouteDataChange={setRouteData}
          onPendingCustomRouteChange={setPendingCustomRoute}
          onPendingCustomRouteSent={(msg?: string) => { showSnackbar(msg || 'Ruta aplicada', 2200); }}
          onShowTransportRoute={showTransportRoute}
          onShowCustomRoute={showCustomRoute}
        />

        <AdminMapControls location={location} onCenterLocation={centerOnLocation} changeTileLayer={changeTileLayer} mapStyle={mapStyle} />
      </View>

      <MapContainer location={location} mapReady={mapReady} webViewRef={webViewRef} editMode={editMode} onMessage={handleWebViewMessage} onMapReady={() => setMapReady(true)} />
      
      {/* Botones flotantes: cargar / filtrar / quitar rutas (solo en capa 'transport') */}
      {mapStyle === 'transport' && !transportLoaded && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => fetchAndShowRoutesFromFirestore()}
          disabled={isLoadingRoutes}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Cargar rutas de transporte"
        >
          {isLoadingRoutes ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ArrowUp color="#fff" size={22} />
          )}
        </TouchableOpacity>
      )}

      {mapStyle === 'transport' && transportLoaded && (
        <>
          <TouchableOpacity
            style={[styles.baseButton, styles.primaryButton, styles.loadRoutesButton]}
            onPress={() => setShowFilter(true)}
            accessible
            accessibilityRole="button"
          >
            <Text style={styles.loadRoutesButtonText}>🧰 Filtrar Rutas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.baseButton, styles.dangerButton, styles.clearRoutesButton]}
            onPress={removeAllRoutes}
            accessible
            accessibilityRole="button"
          >
            <Text style={styles.clearRoutesButtonText}>✖ Quitar Rutas</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal de filtro de rutas */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar rutas</Text>
            <ScrollView style={styles.modalList}>
              {transportFeatures.map((f: any, idx: number) => {
                const id = (f.properties && f.properties.sourceId) || f.properties.name || `route_${idx}`;
                const name = (f.properties && f.properties.name) || id;
                const value = !!visibleMap[id];
                return (
                  <View key={id} style={styles.filterRow}>
                    <Text style={styles.filterName} numberOfLines={1}>{name}</Text>
                    <Switch value={value} onValueChange={() => setVisibleMap((prev) => ({ ...prev, [id]: !prev[id] }))} />
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowFilter(false)}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para quitar todas las rutas */}
      <Modal visible={showConfirmRemove} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { marginBottom: 12 }]}>¿Estás seguro?</Text>
            <Text style={{ marginBottom: 16 }}>Se quitarán todas las rutas del mapa. Esta acción se puede deshacer desde la notificación.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#9e9e9e', marginRight: 8 }]} onPress={() => setShowConfirmRemove(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => confirmRemoveAllRoutes()}>
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {pendingCustomRoute ? (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Aplicando ruta personalizada...</Text>
        </View>
      ) : null}

      {/* Snackbar is provided by SnackbarProvider at app root */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  controlsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  fabButton: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabIcon: {
    fontSize: 24,
  },
  // Button variants
  baseButton: {
    position: 'absolute',
    right: 16,
    borderRadius: 24,
    zIndex: 99999,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#1976D2',
    shadowColor: '#1976D2',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
    shadowColor: '#d32f2f',
  },
  loadRoutesButton: {
    position: 'absolute',
    bottom: 20,
    minWidth: 150,
    borderRadius: 25,
    flexDirection: 'row',
  },
  loadRoutesButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
    marginLeft: 6,
  },
  clearRoutesButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
  clearRoutesButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '70%',
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modalList: { marginBottom: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterName: { flex: 1, marginRight: 8, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#1976D2', borderRadius: 6 },
  modalButtonText: { color: '#fff', fontWeight: '700' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default AdminMapScreen;
