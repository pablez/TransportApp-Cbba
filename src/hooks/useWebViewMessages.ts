import { NavigationProp } from '@react-navigation/native';
import { WebViewMessage, MapPoint } from '../types/admin';

/**
 * Hook para manejar mensajes del WebView
 * Procesa eventos del mapa y coordina navegación
 */
export const useWebViewMessages = (
  navigation: NavigationProp<any>,
  route: any,
  options?: { onMapReady?: () => void }
) => {
  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;

    try {
      const parsed: WebViewMessage = JSON.parse(message);

      if (parsed && parsed.type === 'adminMapPoint') {
        console.log('✏️ Punto admin recibido:', parsed);
        const returnTo = route?.params?.returnTo || null;

        const point: MapPoint = {
          latitude: parsed.latitude ?? 0,
          longitude: parsed.longitude ?? 0,
        };

        if (returnTo) {
          navigation.navigate(returnTo, { adminMapPoint: point });
        } else {
          navigation.setParams({ adminMapPoint: point });
        }
        return;
      }

      if (parsed && (parsed.type === 'routeDisplayed' || parsed.type === 'detailedRouteDisplayed')) {
        console.log('webview route event', parsed);
        return;
      }
    } catch (e) {
      // No es JSON, procesar como texto
    }

    if (message === 'mapReady') {
      if (options && typeof options.onMapReady === 'function') {
        options.onMapReady();
      }
    }
  };

  return { handleWebViewMessage };
};
