import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform
} from 'react-native';
import { ROUTE_150_DATA, ROUTE_230_DATA, ROUTE_INFO } from '../../data/routes';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  AdminHeader,
  AdminSearchBar,
  AdminMapWebView,
  RouteInfoPanel,
  AdminMapControls,
  FloatingSearchButton,
  useAdminMapLogic
} from '../../components/admin';
import tokens from '../../styles/designTokens';
import { useSnackbar } from '../../components/ui/SnackbarProvider';

const AdminMapScreen = ({ navigation, route }) => {
  // Hook personalizado con toda la lógica del mapa
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
    addSearchMarker
  } = useAdminMapLogic();

  // Snackbar from context (needed early because we show snackbars from multiple places)
  const { showSnackbar } = useSnackbar();

  // Obtener parámetros de navegación
  const routeType = route?.params?.routeType || null;
  const editMode = route?.params?.editMode || false;

  // Inicialización
  useEffect(() => {
    getCurrentLocation();
    
    if (routeType) {
      setCurrentRoute(routeType);
    }

    if (route?.params?.editMode) {
      console.log('✏️ Modo edición activado en AdminMap');
    }
  }, [routeType]);

  const defaultRouteColor = tokens.COLORS.PRIMARY;

  const waitForMapReady = (timeout = 6000, interval = 200) => new Promise((resolve, reject) => {
    try {
      if (webViewRef && webViewRef.current && mapReady) return resolve();
      const start = Date.now();
      const iv = setInterval(() => {
        if (webViewRef && webViewRef.current && mapReady) {
          clearInterval(iv);
          return resolve();
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv);
          return reject(new Error('timeout waiting for mapReady'));
        }
      }, interval);
    } catch (e) {
      reject(e);
    }
  });

  // Manejar navegación y parámetros
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Manejar ruta origen-destino
      if (route.params?.origin && route.params?.destination && route.params?.showRoute) {
        console.log('🗺️ Recibiendo datos de ruta completa:', {
          hasOrigin: !!route.params.origin,
          hasDestination: !!route.params.destination,
          hasRouteInfo: !!route.params.routeInfo,
          coordinatesCount: route.params.routeInfo?.coordinates?.length || 0
        });
        
        setRouteData({
          origin: route.params.origin,
          destination: route.params.destination,
          routeInfo: route.params.routeInfo,
          routeError: route.params.routeError
        });
        
        navigation.setParams({ 
          origin: null, 
          destination: null, 
          showRoute: null, 
          routeInfo: null, 
          routeError: null 
        });
        return;
      }
      
      // Manejar lugar seleccionado
      if (route.params?.selectedPlace) {
        const place = route.params.selectedPlace;
        console.log('📍 Lugar seleccionado recibido:', place);
        
        updateMapLocation(place.coordinates.latitude, place.coordinates.longitude);
        addSearchMarker(place);
        
        navigation.setParams({ selectedPlace: null });
      }
    });

    return unsubscribe;
  }, [navigation, mapReady]);

  // Observador directo de route.params
  useEffect(() => {
    if (route?.params?.origin && route?.params?.destination && route?.params?.showRoute) {
      setRouteData({
        origin: route.params.origin,
        destination: route.params.destination,
        routeInfo: route.params.routeInfo,
        routeError: route.params.routeError
      });

      navigation.setParams({ origin: null, destination: null, showRoute: null, routeInfo: null, routeError: null });
    }
  }, [route?.params]);

  // Efecto para manejar rutas origen-destino con reintentos
  useEffect(() => {
    if (!routeData) return;
    // Use a promise-based wait for mapReady instead of polling everywhere
    (async () => {
      try {
        await waitForMapReady(6000);
        console.log('🛣️ Mostrando ruta en el mapa admin (mapReady)');
        try {
          showCustomRoute(routeData);
        } catch (e) {
          console.error('❌ Error al ejecutar showCustomRoute:', e);
        }
      } catch (err) {
        console.warn('⚠️ No fue posible mostrar la ruta: ', err && err.message ? err.message : err);
      }
    })();

    return undefined;
  }, [routeData, mapReady]);

  // Mostrar ruta cuando cambia currentRoute
  useEffect(() => {
    if (currentRoute && mapReady) {
      let routeDataSource = null;
      let routeInfo = null;
      
      switch (currentRoute) {
        case 'line150':
          routeDataSource = ROUTE_150_DATA;
          routeInfo = ROUTE_INFO.line150;
          break;
        case 'line230':
          routeDataSource = ROUTE_230_DATA;
          routeInfo = ROUTE_INFO.line230;
          break;
      }

      if (routeDataSource && routeInfo) {
        showTransportRoute(currentRoute, routeDataSource, routeInfo);
      }
    }

    // Manejar customRoute desde params
    if (route?.params?.customRoute) {
      const cr = route.params.customRoute;
      let coords = cr.coordinates || [];
      if (coords.length > 0 && coords[0] && typeof coords[0] === 'object' && !Array.isArray(coords[0])) {
        try {
          coords = coords.map(c => [c.lng, c.lat]);
        } catch (e) { /* keep original */ }
      }
      const normalized = { ...cr, coordinates: coords };
      setPendingCustomRoute(normalized);
      navigation.setParams({ customRoute: null });
    }
  }, [currentRoute, mapReady, route?.params?.customRoute]);

  // Selector de tipo de mapa (tile layers)
  const [mapStyle, setMapStyle] = useState('standard');
  // Evitar llamadas repetidas a Firestore cuando ya cargamos las rutas de transporte
  const fetchedTransportRef = useRef(false);

  const TILE_STYLES = {
    standard: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '© OpenStreetMap contributors'
    },
    cyclo: {
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors — CyclOSM'
    },
    transport: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors & CARTO'
    }
  };

  const changeTileLayer = (styleKey) => {
    const style = TILE_STYLES[styleKey] || TILE_STYLES.standard;
    setMapStyle(styleKey);
    if (webViewRef.current && mapReady) {
      const script = `if(window.setTileLayer) window.setTileLayer("${style.url}", "${style.attribution.replace(/\"/g,'\\\"')}");`;
      try {
        webViewRef.current.postMessage(script);
        console.log('Enviado setTileLayer al WebView:', styleKey);
        // Si el usuario eligió la capa 'transport', solicitar mostrar las rutas de transporte
        if (styleKey === 'transport') {
          try {
            console.log('Solicitando mostrar rutas de transporte (direct via Firestore).');
            fetchAndShowRoutesFromFirestore();
          } catch (e) { console.error('Error solicitando rutas de transporte:', e); }
        }
      } catch (e) {
        console.error('Error enviando setTileLayer:', e);
      }
    } else {
      // guardar pedido para aplicar cuando el mapa esté listo
      setPendingCustomRoute(prev => ({ ...(prev || {}), _tileChange: styleKey, ...(styleKey === 'transport' ? { _showTransport: true } : {}) }));
    }
  };

  // Procesar pendingCustomRoute
  useEffect(() => {
    if (!pendingCustomRoute) return;
    (async () => {
      try {
        await waitForMapReady(8000);
        const cr = pendingCustomRoute;
        let coordsToSend = cr.coordinates || [];
        if (coordsToSend.length > 0 && coordsToSend[0] && typeof coordsToSend[0] === 'object' && !Array.isArray(coordsToSend[0])) {
          try {
            coordsToSend = coordsToSend.map(c => [c.lng, c.lat]);
          } catch (e) { /* keep original */ }
        }

        const script = `
          if (window.clearTransportRoutes) window.clearTransportRoutes();
          if (window.addTransportRoute) {
            const coords = ${JSON.stringify(coordsToSend)};
            window.addTransportRoute(coords, "${cr.color || defaultRouteColor}", "${(cr.name||'Custom')}" );
          }
        `;

        try {
          webViewRef.current.postMessage(script);
          console.log('✅ pendingCustomRoute enviado:', cr.name || 'custom');
            try { showSnackbar(`Ruta ${cr.name || 'personalizada'} aplicada`, 2200); } catch (e) { /* ignore */ }
          if (cr._tileChange && TILE_STYLES[cr._tileChange]) {
            const style = TILE_STYLES[cr._tileChange];
            try {
              const tileScript = `if(window.setTileLayer) window.setTileLayer("${style.url}", "${style.attribution.replace(/"/g,'\\"')}");`;
              webViewRef.current.postMessage(tileScript);
              console.log('✅ pending tile change aplicado:', cr._tileChange);
            } catch (e) { console.error('Error aplicando pending tile change', e); }
          }
          // Si el pending incluye una solicitud para mostrar rutas de transporte, pedirlo ahora
          if (cr._showTransport) {
            try {
              console.log('Aplicando pending: mostrar rutas de transporte');
              fetchAndShowRoutesFromFirestore();
            } catch (e) { console.error('Error aplicando pending showTransportRoute', e); }
          }
        } catch (e) {
          console.error('❌ Error enviando pendingCustomRoute', e);
        }

        setPendingCustomRoute(null);
      } catch (err) {
        console.warn('⚠️ No se pudo enviar pendingCustomRoute:', err && err.message ? err.message : err);
        setPendingCustomRoute(null);
      }
    })();

    return undefined;
  }, [pendingCustomRoute, mapReady]);

  // Si el mapa queda listo y el estilo actual es 'transport', cargar rutas (solo una vez)
  useEffect(() => {
    if (mapReady && mapStyle === 'transport' && !fetchedTransportRef.current) {
      fetchedTransportRef.current = true;
      console.log('mapReady + transport style detected -> fetchAndShowRoutesFromFirestore');
      fetchAndShowRoutesFromFirestore();
    }

    if (mapStyle !== 'transport') {
      // permitir recargar si el usuario vuelve a seleccionar transport
      fetchedTransportRef.current = false;
    }
  }, [mapReady, mapStyle]);

  // Leer rutas desde Firestore y mostrarlas en el mapa
  const fetchAndShowRoutesFromFirestore = async () => {
    if (!webViewRef.current || !mapReady) {
      console.log('fetchAndShowRoutesFromFirestore: webView no listo, abortando');
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'routes'));
      console.log('Firestore: routes obtenidas:', snap.size);

      if (snap.empty) {
        try { showSnackbar('No se encontraron routes en Firestore', 3000); } catch (e) {}
        return;
      }

      // Consolidar todas las features en una sola FeatureCollection
      const allFeatures = [];
      snap.forEach(docSnap => {
        const data = docSnap.data() || {};
        console.log('Firestore doc:', docSnap.id, 'raw keys:', Object.keys(data));

        // Normalizar coordenadas: soportar legacy {latitude,longitude} o {lat,lng}
        let coords = [];
        if (Array.isArray(data.coordinates) && data.coordinates.length>0) {
          const first = data.coordinates[0];
          if (first && typeof first === 'object') {
            coords = data.coordinates.map(c => {
              const lat = c.latitude ?? c.lat ?? c[1] ?? null;
              const lng = c.longitude ?? c.lng ?? c[0] ?? null;
              return (typeof lng === 'number' && typeof lat === 'number') ? [lng, lat] : null;
            }).filter(Boolean);
          } else if (Array.isArray(first) && first.length>=2) {
            coords = data.coordinates.filter(c => Array.isArray(c) && c.length>=2);
          }
        }

        // Si existe geometry tipo GeoJSON
        if (!coords.length && data.geometry && data.geometry.coordinates) {
          coords = data.geometry.coordinates;
        }

        if (coords && coords.length>0) {
          console.log('Ruta', docSnap.id, 'coordsCount:', coords.length);
          allFeatures.push({
            type: 'Feature',
            properties: { name: data.name || data.title || docSnap.id, color: data.color || defaultRouteColor, sourceId: docSnap.id },
            geometry: { type: 'LineString', coordinates: coords }
          });
        } else {
          console.log('Ruta', docSnap.id, 'sin coordenadas válidas, omitida');
        }
      });

      if (allFeatures.length > 0) {
        const featureCollection = { type: 'FeatureCollection', features: allFeatures };
        try {
          showTransportRoute('all_routes', featureCollection, { name: 'Todas las rutas', color: defaultRouteColor });
        } catch (e) {
          console.error('Error mostrando FeatureCollection consolidada', e);
          try { showSnackbar('Error mostrando routes', 3500); } catch (e) {}
        }
      } else {
        try { showSnackbar('No se encontraron routes válidas en Firestore', 3000); } catch (e) {}
      }
    } catch (error) {
      console.error('Error leyendo rutas de Firestore:', error);
      try { showSnackbar('Error cargando rutas', 3500); } catch (e) {}
    }
  };

  

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;

    try {
      const parsed = JSON.parse(message);

      if (parsed && parsed.type === 'adminMapPoint') {
        console.log('✏️ Punto admin recibido:', parsed);
        const returnTo = route?.params?.returnTo || null;
        if (returnTo) {
          navigation.navigate(returnTo, {
            adminMapPoint: {
              latitude: parsed.latitude,
              longitude: parsed.longitude
            }
          });
        } else {
          navigation.setParams({
            adminMapPoint: {
              latitude: parsed.latitude,
              longitude: parsed.longitude
            }
          });
        }
        return;
      }

      if (parsed && (parsed.type === 'routeDisplayed' || parsed.type === 'detailedRouteDisplayed')) {
        console.log('webview route event', parsed);
        return;
      }

      if (parsed && parsed.type === 'transportAdded') {
        console.log('WebView -> RN: transportAdded', parsed);
        // suppressed transportAdded snackbar
        return;
      }

      if (parsed && parsed.type === 'transportError') {
        console.error('WebView -> RN: transportError', parsed);
        // suppressed transportError snackbar
        return;
      }

      // Log any other parsed message for debugging
      if (parsed) {
        console.log('WebView -> RN (parsed):', parsed);
        return;
      }
    } catch (e) {
      // No es JSON, procesar como texto
      console.log('WebView -> RN (raw):', message);
    }

    if (message === 'mapReady') {
      setMapReady(true);
      if (location) {
        updateMapLocation(location.latitude, location.longitude);
      }
    }
  };

  // Manejar búsqueda
  const handleSearch = () => {
    console.log('🔍 Navegando a LocationSearch...');
    navigation.navigate('LocationSearch');
  };

  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.COLORS.PRIMARY_LIGHT} />
        <Text>🔍 Obteniendo ubicación GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={tokens.COLORS.PRIMARY} barStyle="light-content" />
      
      <AdminHeader 
        currentRoute={currentRoute}
        onCloseRoute={() => setCurrentRoute(null)}
      />

      <AdminSearchBar onPress={handleSearch} />

      <View style={styles.controlsContainer}>
        <RouteInfoPanel 
          currentRoute={currentRoute}
          onCloseRoute={() => setCurrentRoute(null)}
        />
        {/* AdminMapControls (moved fuera como flotante) */}

        {/* (Botón movido debajo del WebView para ser visible en toda la pantalla) */}
      </View>

      <AdminMapWebView 
        location={location}
        mapReady={mapReady}
        webViewRef={webViewRef}
        editMode={editMode}
        onMessage={handleWebViewMessage}
        onMapReady={() => setMapReady(true)}
      />

      {/* Controles flotantes sobre el mapa (zoom + ubicación + selector de capas) */}
      <View style={styles.floatingControls} pointerEvents="box-none">
        <AdminMapControls 
          location={location}
          onCenterLocation={centerOnLocation}
          changeTileLayer={changeTileLayer}
          mapStyle={mapStyle}
        />
      </View>

      {/* Botón flotante para forzar carga de todas las routes desde Firestore (solo visible en capa transport) */}
      {(() => {
        console.log('🔍 DEBUG: mapStyle =', mapStyle, '| renderizando botón =', mapStyle === 'transport');
        return mapStyle === 'transport' && (
          <TouchableOpacity
            style={styles.loadRoutesButton}
            onPress={() => {
              console.log('🔥 BOTON CARGAR ROUTES PRESIONADO');
              // loading snackbar suppressed
              fetchAndShowRoutesFromFirestore();
            }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cargar routes"
          accessibilityHint="Carga todas las rutas desde la colección routes de Firestore y las muestra en el mapa"
        >
            <Text style={styles.loadRoutesButtonText}>🚌 CARGAR</Text>
          </TouchableOpacity>
        );
      })()}

      {/* Botón flotante para centrar en ubicación */}
      <TouchableOpacity
        style={[styles.locButton, { bottom: 80 }]}
        onPress={() => {
          try { centerOnLocation(); } catch (e) { console.error('Error centering', e); }
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Centrar ubicación"
        accessibilityHint="Centra el mapa en tu ubicación actual"
      >
        <Text style={styles.locButtonText}>📍</Text>
      </TouchableOpacity>

      <FloatingSearchButton onPress={handleSearch} />

      {/* Snackbar is provided by SnackbarProvider at app root */}

      {/* Overlay cuando hay pendingCustomRoute para bloquear interacciones */}
      {pendingCustomRoute ? (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Aplicando ruta personalizada...</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.COLORS.BACKGROUND,
  },
  controlsContainer: {
    backgroundColor: tokens.COLORS.SURFACE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    margin: 10,
    ...tokens.SHADOW.small,
  },
  loadRoutesButton: {
    position: 'absolute',
    right: 14,
    bottom: 160,
    backgroundColor: '#FF5722',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 32,
    zIndex: 99999,
    elevation: 50,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    borderWidth: 4,
    borderColor: '#fff',
  },
  loadRoutesButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  locButton: {
    position: 'absolute',
    right: 14,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 28,
    zIndex: 2000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  locButtonText: {
    fontSize: 20
  },
  floatingControls: {
    position: 'absolute',
    left: 14,
    top: 110,
    zIndex: 2100,
    elevation: 10,
    // allow the inner controls to render shadow beyond this container
    backgroundColor: 'transparent'
  },
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
    backgroundColor: tokens.COLORS.BACKGROUND,
  },
});

export default AdminMapScreen;