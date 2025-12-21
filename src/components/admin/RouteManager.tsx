import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ROUTE_150_DATA, ROUTE_230_DATA, ROUTE_INFO } from '../../data/routes';
import RouteInfoPanel from './RouteInfoPanel';
import { CustomRoute } from '../../types/admin';
import { TILE_STYLES } from './TileLayerSelector';

interface RouteManagerProps {
  currentRoute: string | null;
  routeData: any;
  pendingCustomRoute: CustomRoute | null;
  mapReady: boolean;
  webViewRef: React.RefObject<any>;
  onCurrentRouteChange: (route: string | null) => void;
  onRouteDataChange: (data: any) => void;
  onPendingCustomRouteChange: (route: CustomRoute | null) => void;
  onShowTransportRoute: (routeKey: string, data: any, info: any) => void;
  onShowCustomRoute: (data: any) => void;
  onPendingCustomRouteSent?: (message?: string) => void;
}

/**
 * Componente para gestionar la lógica de rutas
 * Maneja la selección de rutas, datos de rutas y renderización
 */
const RouteManager: React.FC<RouteManagerProps> = ({
  currentRoute,
  routeData,
  pendingCustomRoute,
  mapReady,
  webViewRef,
  onCurrentRouteChange,
  onRouteDataChange,
  onPendingCustomRouteChange,
  onShowTransportRoute,
  onShowCustomRoute,
  onPendingCustomRouteSent,
}) => {
  // Efecto para mostrar ruta cuando cambia currentRoute
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
        onShowTransportRoute(currentRoute, routeDataSource, routeInfo);
      }
    }
  }, [currentRoute, mapReady, onShowTransportRoute]);

  // Efecto para mostrar rutas provenientes de routeData (origin/destination) con reintentos
  useEffect(() => {
    if (!routeData) return;

    let attempts = 0;
    const maxAttempts = 15;
    let intervalId: NodeJS.Timeout | null = null;

    const tryShow = () => {
      attempts += 1;
      const hasWebView = !!webViewRef?.current;

      if (hasWebView && mapReady) {
        try {
          onShowCustomRoute(routeData);
        } catch (e) {
          console.error('❌ Error al ejecutar onShowCustomRoute:', e);
        }
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }

      if (attempts >= maxAttempts) {
        console.warn('⚠️ No fue posible mostrar la ruta tras varios intentos');
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    tryShow();
    if (!(webViewRef?.current && mapReady)) {
      intervalId = setInterval(tryShow, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [routeData, mapReady, webViewRef, onShowCustomRoute]);

  // Efecto para procesar pendingCustomRoute y enviarlo al WebView
  useEffect(() => {
    if (!pendingCustomRoute) return;

    let attempts = 0;
    const maxAttempts = 20;
    let intervalId: NodeJS.Timeout | null = null;

    const trySend = () => {
      attempts += 1;
      const ready = !!webViewRef?.current && mapReady;

      if (ready) {
        const cr = pendingCustomRoute;
        let coordsToSend = cr.coordinates || [] as any[];

        if (coordsToSend.length > 0 && coordsToSend[0] && typeof coordsToSend[0] === 'object' && !Array.isArray(coordsToSend[0])) {
          try {
            coordsToSend = coordsToSend.map((c: any): [number, number] => [c.lng, c.lat]);
          } catch (e) { /* keep original */ }
        }

        const script = `
          if (window.clearTransportRoutes) window.clearTransportRoutes();
          if (window.addTransportRoute) {
            const coords = ${JSON.stringify(coordsToSend)};
            window.addTransportRoute(coords, "${cr.color || '#1976D2'}", "${(cr.name||'Custom')}" );
          }
        `;

        try {
          webViewRef.current.postMessage(script);
          console.log('✅ pendingCustomRoute enviado:', cr.name || 'custom');
          if (onPendingCustomRouteSent) {
            try { onPendingCustomRouteSent(`Ruta ${cr.name || 'personalizada'} aplicada`); } catch (e) { /* ignore */ }
          }

          if (cr._tileChange && TILE_STYLES[cr._tileChange as any]) {
            const style = TILE_STYLES[cr._tileChange as any];
            try {
              const tileScript = `if(window.setTileLayer) window.setTileLayer("${style.url}", "${style.attribution.replace(/"/g, '\\"')}");`;
              webViewRef.current.postMessage(tileScript);
              console.log('✅ pending tile change aplicado:', cr._tileChange);
            } catch (e) { console.error('Error aplicando pending tile change', e); }
          }
        } catch (e) {
          console.error('❌ Error enviando pendingCustomRoute', e);
        }

        onPendingCustomRouteChange(null);
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        return;
      }

      if (attempts >= maxAttempts) {
        console.warn('⚠️ No se pudo enviar pendingCustomRoute');
        onPendingCustomRouteChange(null);
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      }
    };

    trySend();
    if (!(webViewRef?.current && mapReady)) {
      intervalId = setInterval(() => {
        if (!pendingCustomRoute) { if (intervalId) { clearInterval(intervalId); intervalId = null; } return; }
        trySend();
      }, 300);
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [pendingCustomRoute, mapReady, webViewRef, onPendingCustomRouteChange]);

  const handleCloseRoute = () => {
    onCurrentRouteChange(null);
  };

  return (
    <View style={styles.container}>
      <RouteInfoPanel 
        currentRoute={currentRoute}
        onCloseRoute={handleCloseRoute}
        onDetails={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default RouteManager;
