ORS Proxy (Express)
=====================

Pequeño proxy para OpenRouteService (ORS) para evitar exponer la API key en clientes móviles.

Deploy recomendados:
- Google Cloud Run (preferido)
- Firebase Cloud Functions (con `functionsFramework` / HTTP function)

Variables de entorno requeridas:
- `ORS_API_KEY` : la clave de OpenRouteService
- `ORS_BASE` (opcional) : URL base, por defecto https://api.openrouteservice.org

Ejemplo local:

```bash
# desde functions/orsProxy
npm install
ORS_API_KEY=your_key_here node index.js
# luego visitar http://localhost:8080/health
```

Ejemplo de uso (curl):

```bash
curl -X POST 'http://localhost:8080/directions/driving-car' \
  -H 'Content-Type: application/json' \
  -d '{"coordinates":[[-66.1568,-17.3895],[-66.153,-17.392]]}'
```

Despliegue en Firebase Cloud Functions (recomendado):

1) Desde la carpeta `functions/orsProxy` instala dependencias:

```bash
cd functions/orsProxy
npm install
```

2) Configurar la clave en Firebase (recomendado: `functions.config` o Secret Manager)

```bash
# Usando functions config (rápido):
firebase functions:config:set ors.key="YOUR_ORS_KEY"

# Alternativa (recomendado para producción): crea un secreto en Secret Manager y conéctalo a la función
```

3) Desplegar la función desde la raíz del proyecto Firebase:

```bash
# en la raíz del repo (donde está firebase.json)
firebase deploy --only functions:orsProxy --project YOUR_FIREBASE_PROJECT_ID
```

4) Uso y notas de seguridad:
- La función buscará la key en `functions.config().ors.key` y, si no existe, en la variable de entorno `ORS_API_KEY`.
- No subas claves al repo. Usa Secret Manager o `functions.config` y rotálas si fueron expuestas.
- Añade caching y rate-limiting si esperas mucho tráfico.
