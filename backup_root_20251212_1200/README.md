# 🚌 TransportApp Cochabamba

Una aplicación móvil de transporte público para la ciudad de Cochabamba, Bolivia, desarrollada con React Native y Expo. La aplicación simula el funcionamiento de plataformas como Uber, pero está específicamente diseñada para el transporte público local.

## 📱 Características Principales

### Para Pasajeros
- 🗺️ **Mapa en tiempo real** con ubicación de vehículos disponibles
- 👥 **6 tipos de pasajeros** con tarifas diferenciadas:
  - General: 2.5 Bs
  - Adulto mayor: 1.5 Bs
  - Discapacitado: 1.5 Bs
  - Universitario: 1.0 Bs
  - Escolar (Primaria): 0.5 Bs
  - Escolar (Secundaria): 1.0 Bs
- 💳 **Múltiples métodos de pago**: Efectivo y códigos QR
- 📍 **Seguimiento de viaje** en tiempo real

### Para Conductores
- 🔄 **Estado online/offline** configurable
- 📋 **Gestión de solicitudes** de viaje
- 📍 **Actualización automática** de ubicación
- ✅ **Sistema de aceptación/rechazo** de viajes
- 📊 **Panel de control** personalizado

### Para Administradores
- 👨‍💼 **Panel administrativo completo**
- 👥 **Gestión de usuarios** (activar/desactivar/eliminar)
- 🚗 **Administración de vehículos**
- 📈 **Historial y reportes** de viajes
- 📊 **Estadísticas de uso**

## 🛠️ Stack Tecnológico

- **Frontend**: React Native con Expo
- **Autenticación**: Firebase Authentication
- **Base de datos**: Firebase Firestore
- **Mapas**: React Native Maps
- **Geolocalización**: Expo Location
- **Scanner QR**: Expo Barcode Scanner
- **Navegación**: React Navigation
- **API de rutas**: OpenRouteService

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- Expo CLI
- Cuenta de Firebase
- Android Studio (para Android) o Xcode (para iOS)

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd TransportApp
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Firestore Database y Authentication
3. Configurar `src/services/firebaseConfig.js` con tus credenciales
4. Ver guía detallada en `FIREBASE_SETUP.md`

### 4. Ejecutar la aplicación
```bash
# Desarrollo
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📁 Estructura del Proyecto

```
TransportApp/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── QRScannerComponent.js
│   ├── context/            # Contextos de React
│   │   └── AuthContext.js
│   ├── navigation/         # Navegación
│   │   └── AppNavigator.js
│   ├── screens/           # Pantallas principales
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── PassengerScreen.js
│   │   ├── DriverScreen.js
│   │   ├── AdminScreen.js
│   │   └── PaymentScreen.js
│   ├── services/          # Servicios API
│   │   ├── firebaseConfig.js
│   │   └── firestoreService.js
│   └── utils/            # Utilidades
│       ├── constants.js
│       └── helpers.js
├── assets/               # Recursos estáticos
├── App.js               # Componente principal
└── app.json            # Configuración Expo
```

## 🎯 Funcionalidades Implementadas

### ✅ Completadas
- [x] Sistema de autenticación (Login/Registro)
- [x] Roles de usuario (Pasajero, Conductor, Admin)
- [x] Interfaz de mapas con ubicación en tiempo real
- [x] Sistema de tarifas diferenciadas por tipo de pasajero
- [x] Panel administrativo
- [x] Gestión de vehículos
- [x] Navegación por roles

### 🔄 En Desarrollo
- [ ] Integración completa con OpenRouteService
- [ ] Notificaciones push
- [ ] Optimización de rutas


## 📱 Capturas de Pantalla

### Pantalla de Login
- Autenticación segura con Firebase
- Validación de formularios
- Redirección automática por roles

### Pantalla de Pasajero
- Mapa interactivo con conductores cercanos
- Selector de tipo de pasajero
- Cálculo automático de tarifas
- Botón de solicitud de viaje

### Pantalla de Conductor
- Toggle de estado online/offline
- Lista de solicitudes de viaje
- Información de viaje actual
- Botones de aceptar/completar

### Panel de Administrador
- Tres pestañas: Usuarios, Vehículos, Lineas
- Gestión completa de usuarios
- Estados y acciones en tiempo real


## 🔧 Configuración

### Permisos Requeridos
- **Ubicación**: Para mostrar mapas y conductores cercanos
- **Cámara**: Para escáner de códigos QR
- **Internet**: Para Firebase y APIs

### Variables de Entorno
El proyecto usa las siguientes APIs:
- **Firebase**: Autenticación y base de datos
- **OpenRouteService**: API Key incluida en `constants.js`

## 📚 Documentación Adicional

- [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) - Configuración detallada de Firebase
- [`DEVELOPMENT_GUIDE.md`](DEVELOPMENT_GUIDE.md) - Guía de desarrollo y testing


## 🎯 Características del Transporte Público Boliviano

La aplicación está diseñada específicamente para el contexto boliviano:

- **Tarifas oficiales** según regulaciones de Cochabamba
- **Tipos de pasajero** según descuentos legales
- **Interfaz en español** con terminología local

**Desarrollado con ❤️ para el transporte público de Cochabamba, Bolivia**
