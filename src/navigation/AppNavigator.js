import React, { useEffect, useRef } from 'react';
import { BackHandler, Alert, Dimensions } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import DrawerContent from '../components/DrawerContent';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import GuestScreen from '../screens/public/GuestScreen';
import PublicRoutesScreen from '../screens/public/PublicRoutesScreen';
import PublicMapScreen from '../screens/public/PublicMapScreen';
import BottomTabs from './BottomTabs';

// Pantallas principales
import PassengerScreen from '../screens/user/PassengerScreen';
import DriverScreen from '../screens/user/DriverScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMapScreen from '../screens/admin/AdminMapScreenRefactored';
import EditMapScreen from '../screens/maps/EditMapScreen';
import AdminLinesScreenRefactored from '../screens/admin/AdminLinesScreenRefactored';
import LocationSearchScreen from '../screens/search/LocationSearchScreen.tsx';
import UserApprovalScreen from '../screens/admin/UserApprovalScreen';
import PaymentScreen from '../screens/user/PaymentScreen';
import SimpleTestScreen from '../screens/tests/SimpleTestScreen';
import EditProfileScreen from '../screens/user/EditProfileScreen';
import RouteSearchScreen from '../screens/search/RouteSearchScreen';
import RouteMapTest from '../screens/RouteMapTest';

const Drawer = createDrawerNavigator();

// Mapeo de nombres de pantalla a rutas de archivo (útil para debugging)
const SCREEN_PATHS = {
  Login: 'src/screens/auth/LoginScreen.js',
  MainTabs: 'src/navigation/BottomTabs.js',
  Guest: 'src/screens/public/GuestScreen.js',
  PublicRoutes: 'src/screens/public/PublicRoutesScreen.js',
  PublicMap: 'src/screens/public/PublicMapScreen.js',
  Register: 'src/screens/auth/RegisterScreen.js',
  EditProfile: 'src/screens/user/EditProfileScreen.js',
  UserApproval: 'src/screens/admin/UserApprovalScreen.js',
  AdminMap: 'src/screens/admin/AdminMapScreenRefactored.tsx',
  AdminDashboard: 'src/screens/admin/AdminDashboardScreen.tsx',
  AdminLines: 'src/screens/admin/AdminLinesScreenRefactored.tsx',
  EditMap: 'src/screens/maps/EditMapScreen.tsx',
    LocationSearch: 'src/screens/search/LocationSearchScreen.tsx',
  PassengerMain: 'src/screens/user/PassengerScreen.js',
  RouteSearch: 'src/screens/search/RouteSearchScreen.js',
  Payment: 'src/screens/user/PaymentScreen.js',
  DriverMain: 'src/screens/user/DriverScreen.js'
};

const AppNavigator = () => {
  const { user, userRole, isAdmin, loading } = useAuth();
  const navigationRef = useRef();
  const isFirstRun = useRef(true);

  // Helper para obtener la ruta activa (puede ser anidada en stacks)
  const getActiveRouteName = (state) => {
    if (!state) return null;
    const route = state.routes[state.index || 0];
    // Dive into nested navigators
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  console.log('=== NAVIGATOR DEBUG ===');
  console.log('User:', user ? 'Logged in' : 'Not logged in');
  console.log('UserRole:', userRole);
  console.log('IsAdmin:', isAdmin);
  console.log('Loading:', loading);
  console.log('========================');

  // Efecto para navegar automáticamente cuando el usuario cambie
  useEffect(() => {
    if (!loading && navigationRef.current) {
      if (user) {
        // Usuario autenticado - navegar a la pantalla apropiada
        console.log('Usuario autenticado, navegando...');
        let targetScreen = "AdminMap"; // Default fallback
        
        if (isAdmin) {
          targetScreen = "AdminMap";
        } else if (userRole === USER_ROLES.PASSENGER) {
          targetScreen = "PassengerMain";
        } else if (userRole === USER_ROLES.DRIVER) {
          targetScreen = "DriverMain";
        }
        
        console.log('Navegando a (reset dispatch):', targetScreen);
        const doReset = () => {
          try {
            navigationRef.current.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: targetScreen }],
              })
            );
          } catch (e) {
            console.warn('Reset dispatch falló, usando navigate fallback', e);
            navigationRef.current.navigate(targetScreen);
          }
        };

        if (navigationRef.current.isReady && navigationRef.current.isReady()) {
          doReset();
        } else {
          // Pequeño retry hasta que el nav container esté listo
          const t = setInterval(() => {
            if (navigationRef.current && navigationRef.current.isReady && navigationRef.current.isReady()) {
              clearInterval(t);
              doReset();
            }
          }, 50);
        }
      } else if (!isFirstRun.current) {
        // Usuario no autenticado (después del primer render) - volver al login
        console.log('Usuario no autenticado, reseteando a Login (dispatch)');
        const doResetToLogin = () => {
          try {
            navigationRef.current.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
            );
          } catch (e) {
            navigationRef.current.navigate('Login');
          }
        };

        if (navigationRef.current && navigationRef.current.isReady && navigationRef.current.isReady()) {
          doResetToLogin();
        } else {
          const t2 = setInterval(() => {
            if (navigationRef.current && navigationRef.current.isReady && navigationRef.current.isReady()) {
              clearInterval(t2);
              doResetToLogin();
            }
          }, 50);
        }
      }
    }
    
    if (!loading) {
      isFirstRun.current = false;
    }
  }, [user, userRole, isAdmin, loading]);

  // Manejar botón físico Atrás (Android) — solo ir al último screen, no cerrar sesión
  useEffect(() => {
    const onBackPress = () => {
      try {
        if (!navigationRef.current) return false;
        // Si hay historial, ir atrás
        if (navigationRef.current.canGoBack && navigationRef.current.canGoBack()) {
          navigationRef.current.goBack();
          return true; // manejado
        }

        // Si no hay historial, preguntar si desea salir de la app
        Alert.alert('Salir', '¿Deseas salir de la aplicación?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      } catch (e) {
        return false;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        } else if (typeof BackHandler.removeEventListener === 'function') {
          BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  if (loading) {
    return null; // O un componente de loading
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={(state) => {
        try {
          const active = getActiveRouteName(state);
          console.log('📍 Screen activa:', active);
          const screenPath = SCREEN_PATHS[active] || 'ruta desconocida';
          console.log('📁 Ruta del screen:', screenPath);
        } catch (e) {
          console.log('📍 Screen activa: (error al obtener)', e);
        }
      }}
    >
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          drawerStyle: {
              width: Math.round(Dimensions.get('window').width * 0.75), // 3/4 de la pantalla
            },
          swipeEnabled: true,
          gestureEnabled: true,
        }}
        initialRouteName="Login"
      >
        {/* Pantallas de autenticación - siempre disponibles */}
  <Drawer.Screen name="Login" component={LoginScreen} />
  {/* Navegador inferior moderno para usuarios (incluye Rutas, Mapa, Cuenta) */}
  <Drawer.Screen name="MainTabs" component={BottomTabs} options={{ title: 'Explorar' }} />
  <Drawer.Screen name="Guest" component={GuestScreen} />
  <Drawer.Screen name="PublicRoutes" component={PublicRoutesScreen} />
  <Drawer.Screen 
    name="PublicMap" 
    component={PublicMapScreen} 
    options={{ drawerItemStyle: { display: 'none' } }} 
  />
  <Drawer.Screen name="Register" component={RegisterScreen} />
  <Drawer.Screen name="RouteMapTest" component={RouteMapTest} options={{ drawerItemStyle: { display: 'none' } }} />

        {/* Pantallas para usuarios autenticados */}
        {user && (
          <>
            {/* Pantallas comunes para todos los usuarios autenticados */}
            <Drawer.Screen name="EditProfile" component={EditProfileScreen} />
            <Drawer.Screen name="AdminMap" component={AdminMapScreen} />

            {/* Pantallas específicas para Admin */}
            {isAdmin && (
              <>
                <Drawer.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Drawer.Screen name="AdminLines" component={AdminLinesScreenRefactored} />
                {/* Pantalla dedicada para edición de rutas desde AdminLines */}
                <Drawer.Screen name="EditMap" component={EditMapScreen} options={{ drawerItemStyle: { display: 'none' } }} />
                {/* LocationSearch (registrado en la sección compartida más abajo) */}
                <Drawer.Screen 
                  name="UserApproval" 
                  component={UserApprovalScreen}
                  options={{ 
                    drawerItemStyle: { display: 'none' } // Ocultar del drawer
                  }}
                />
              </>
            )}

            {/* Hacer LocationSearch accesible también a pasajeros si la política de roles lo requiere */}
            {(isAdmin || userRole === USER_ROLES.PASSENGER) && (
              <Drawer.Screen name="LocationSearch" component={LocationSearchScreen} />
            )}

            {/* Pantallas específicas para Pasajero */}
            {userRole === USER_ROLES.PASSENGER && (
              <>
                {/* PassengerMain ahora apunta a PassengerScreen (map/UX para pasajeros) */}
                <Drawer.Screen name="PassengerMain" component={PassengerScreen} />
                <Drawer.Screen 
                  name="RouteSearch" 
                  component={RouteSearchScreen}
                  options={{ 
                    drawerItemStyle: { display: 'none' } // Ocultar del drawer
                  }}
                />
                <Drawer.Screen 
                  name="Payment" 
                  component={PaymentScreen}
                  options={{ 
                    drawerItemStyle: { display: 'none' } // Ocultar del drawer
                  }}
                />
              </>
            )}

            {/* Pantallas específicas para Conductor */}
            {userRole === USER_ROLES.DRIVER && (
              <Drawer.Screen name="DriverMain" component={DriverScreen} />
            )}
          </>
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

