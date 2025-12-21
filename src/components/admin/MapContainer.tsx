import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import AdminMapWebView from './AdminMapWebView';
import { WebViewMessage, MapPoint, Coordinates } from '../../types/admin';

interface MapContainerProps {
  location: Coordinates | null;
  mapReady: boolean;
  webViewRef: React.RefObject<any>;
  editMode: boolean;
  onMessage: (event: any) => void;
  onMapReady: () => void;
  onAdminMapPoint?: (point: MapPoint) => void;
}

/**
 * Componente contenedor para el mapa WebView
 * Maneja la renderización del webview y la comunicación con el mapa embebido
 */
const MapContainer: React.FC<MapContainerProps> = ({
  location,
  mapReady,
  webViewRef,
  editMode,
  onMessage,
  onMapReady,
  onAdminMapPoint,
}) => {
  const handleWebViewMessage = useCallback((event: any) => {
    const message = event.nativeEvent.data;

    try {
      const parsed: WebViewMessage = JSON.parse(message);
      
      if (parsed && parsed.type === 'adminMapPoint') {
        console.log('✏️ Punto admin recibido:', parsed);
        if (onAdminMapPoint) {
          onAdminMapPoint({
            latitude: parsed.latitude ?? 0,
            longitude: parsed.longitude ?? 0,
          });
        }
        return;
      }

      if (parsed && (parsed.type === 'routeDisplayed' || parsed.type === 'detailedRouteDisplayed')) {
        console.log('webview route event', parsed);
        return;
      }
    } catch (e) {
      // No es JSON
    }

    if (message === 'mapReady') {
      onMapReady();
    }

    // Llamar al handler adicional si existe
    onMessage(event);
  }, [onMessage, onMapReady, onAdminMapPoint]);

  return (
    <View style={styles.container}>
      <AdminMapWebView 
        location={location}
        mapReady={mapReady}
        webViewRef={webViewRef}
        editMode={editMode}
        onMessage={handleWebViewMessage}
        onMapReady={onMapReady}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default MapContainer;
