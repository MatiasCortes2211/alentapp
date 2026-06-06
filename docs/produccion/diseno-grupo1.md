# Diseño de Infraestructura — Fase 2

**Grupo:** 1  
**Proyecto:** alentapp

---

## 2.1 Diseño de la infraestructura Docker
 
### a) `packages/api/Dockerfile.prod`
 
#### Propósito
 
Construir una imagen de producción de la API que sea segura, liviana y autosuficiente.
 
#### Estructura — 3 etapas
 
| Etapa | Nombre | Base | Propósito |
|---|---|---|---|
| Stage 1 | `deps` | `node:22-alpine` | Instalar solo dependencias de producción (`npm ci --omit=dev`) |
| Stage 2 | `build` | `node:22-alpine` | Compilar TypeScript con `tsc`, generar Prisma Client |
| Stage 3 | `runtime` | `node:22-alpine` | Imagen final: JS compilado + node_modules prod + usuario no-root |
 
**Stage 1 — `deps`**
 
Copia solo los package.json e instala únicamente las dependencias de producción. Se hace antes de copiar el código fuente para aprovechar el cache de Docker — si las dependencias no cambiaron, esta etapa se saltea automáticamente en el próximo build.
 
**Stage 2 — `build`**

Instala todas las dependencias (incluyendo las de desarrollo) y compila el proyecto en tres pasos:
1. `prisma generate` — genera el cliente de base de datos compilado para Linux. Si se generara en Mac/Windows, no funcionaría dentro del contenedor.
2. `npm run build -w packages/api` — convierte el TypeScript de la API a JavaScript puro en la carpeta `dist/`.
3. `npm run build -w packages/shared` — lo mismo para el paquete shared. Necesario porque tiene un `enum` que Node no puede ejecutar como TypeScript sin compilar.

**Stage 3 — `runtime`**
 
La imagen final que se despliega. Solo contiene lo necesario para que la app corra:
- `packages/api/dist/` — la API compilada a JavaScript
- `packages/shared/dist/` — el paquete shared compilado
- `node_modules` de producción del Stage 1
- `packages/api/prisma/` — Prisma lo necesita en runtime para hacer consultas a la base de datos


#### Requisitos no funcionales
 
- **Usuario no-root:** se usa `USER node` (usuario sin privilegios incluido en la imagen base)
- **Healthcheck:** `wget -qO- http://localhost:3000/health || exit 1` cada 10s, con `start_period` de 15s para dar tiempo al startup de la API.
- **`.dockerignore`:** excluye `node_modules`, `.git`, `dist`, `*.log`, `.env`, archivos de test (`*.test.ts`, `*.spec.ts`). Evita que el contexto de build sea innecesariamente pesado y que archivos sensibles entren en la imagen.
- **Tamaño objetivo:** ≤ 300 MB (reducción ≥ 70% respecto a la imagen de desarrollo ~1 GB).
- **`ENV NODE_ENV=production`:** Node.js omite la carga de `devDependencies` en runtime.
---

### b) `packages/web/Dockerfile.prod`

#### Propósito

Este Dockerfile nos permitirá usar nginx para servir el frontend en producción, ya que esta es más rápida y liviana que Node.js, la cual usamos en desarrollo. Gracias al multi-stage build se puede usar Node.js y todas las herramientas de build en **etapas intermedias**, y copiar únicamente el resultado final (`dist/`) a la imagen de runtime.

#### Estructura

| Etapa | Nombre | Base | Propósito |
|---|---|---|---|
| Stage 1 | `deps` | `node:22-alpine` | Instalar dependencias |
| Stage 2 | `build` | `node:22-alpine` | Build de Vite (vite build) |
| Stage 3 | `runtime` | `nginxinc/nginx-unprivileged:stable-alpine` | Servir archivos estáticos con nginx |

**Stage 1: `deps`**\
Esta etapa instala las dependencias del proyecto. Copia únicamente los archivos package.json del monorepo raíz, de `packages/web`, y de `packages/shared` (es decir, antes de copiar el código fuente). Luego instala las dependencias (exactamente lo que está en el package-lock.json sin modificarlo).

**Stage 2: `build`**\
Ejecuta el script de build del workspace web. El cual compila TypeScript a JavaScript y luego empaqueta todo en el directorio `dist/`. Al terminar esta etapa, el resultado está en `/app/packages/web/dist`.

**Stage 3: `runtime`**\
Este stage es el de producción, el cual copia unicamente el directorio dist/ del stage anterior para que nginx pueda servir el frontend. Además, expone el puerto 8080 y define un healthcheck que verifica periódicamente que nginx esté respondiendo correctamente en la configuración de nginx (`packages/web/nginx.conf`).

#### Requisitos no funcionales

**Tamaño máximo imagen final** ≤ 170 MB (reducción ≥ 70% respecto a ~570 MB dev)\
**No incluir herramientas de build** en la imagen final (tsc, vite, npm, eslint, vitest)\
**Servidor web nginx** para servir el frontend (no Node.js en producción)\
**Configurar compresión** gzip, cache de assets, y security headers\
**Healthcheck** contra localhost:8080\
**Usuario sin root** (nginx corre sin root por defecto en `nginxinc/nginx-unprivileged`)\
 
---

### c) `docker-compose.prod.yml`

#### Propósito
Orquestar los contenedores (Base de datos, API y Web) para el entorno productivo, garantizando que operen de forma segura, aislada y con límites de recursos para no comprometer el servidor host.

#### Estructura
El archivo definirá tres servicios principales (`db`, `api`, `web`), una red interna personalizada para la comunicación entre ellos, y volúmenes únicamente para la persistencia de datos (eliminando los volúmenes de código fuente usados en desarrollo).

#### Requisitos no funcionales
Resiliencia (reinicio automático y comprobación de estado de salud), seguridad estricta (sistemas de archivos de solo lectura y privilegios mínimos) y control de almacenamiento (rotación de logs).

#### Diseño de la configuración de servicios

| Aspecto | Requisito / Implementación |
| :--- | :--- |
| **Resource limits** | Se aplicarán bloques `deploy.resources` a cada servicio. Por ejemplo, la API tendrá un límite estricto de memoria (`mem_limit: 512m`) y CPU (`cpus: '0.5'`) para prevenir fugas de memoria (memory leaks) que afecten al host. |
| **Healthchecks** | **API:** Comprobación mediante `curl -f http://localhost:3000/health` (o endpoint equivalente).<br>**DB:** Comprobación nativa con `pg_isready -U admin -d alentapp_db`. Los servicios dependerán del estado "healthy" de la BD. |
| **Seguridad** | • `read_only: true`: Evita que un atacante modifique archivos o instale malware.<br>• `cap_drop: [ALL]`: Elimina permisos nativos del kernel de Linux.<br>• `cap_add: [NET_BIND_SERVICE]`: Único permiso otorgado para abrir puerto.<br>• `security_opt: [no-new-privileges:true]`: Evita el escalado de privilegios. |
| **Logging** | Se configurará el bloque `logging` con el driver `json-file` y opciones para limitar el tamaño y evitar que los logs saturen el disco duro del servidor: `max-size: "10m"` y `max-file: "3"`. |
| **Red** | Se creará una red interna explícita (ej. `alentapp-prod-net`). Los contenedores se comunicarán a través de esta red, evitando usar la red bridge por defecto de Docker, mejorando el aislamiento DNS. |
| **Secrets** | Se eliminarán las credenciales hardcodeadas (ej. contraseñas de BD). Los servicios consumirán estas credenciales de forma segura mediante la directiva `env_file: - .env` u ocultas en el entorno del servidor. |

---

## 2.2 Diseño de la observabilidad

### a) Métricas RED a capturar

Se definieron 5 métricas en total: las 3 métricas fundamentales del método
RED más 2 métricas adicionales de infraestructura solicitadas por la consigna.

| Métrica | Tipo OpenTelemetry | Nombre en código | Descripción | Labels |
|---|---|---|---|---|
| **Rate** | Counter | `http.requests.total` | Total de requests HTTP recibidos por la API | method, route, status |
| **Errors** | Counter | `http.requests.errors` | Total de requests que fallaron (4xx o 5xx) | method, route, status |
| **Duration** | Histogram | `http.request.duration` | Latencia de cada request en milisegundos | method, route |
| **Memoria** | Gauge | `process.memory.usage` | RAM utilizada por el proceso Node.js en tiempo real | — |
| **Requests activos** | Gauge | `http.requests.active` | Cantidad de requests procesándose al mismo tiempo | — |

---

### Detalle de cada métrica

**Rate — http.requests.total**

Tipo: Counter. Un contador que solo sube, nunca baja. Suma 1 cada vez
que llega un request a la API, sin importar si fue exitoso o no.

Labels:
- method: el verbo HTTP del request (GET, POST, PUT, DELETE)
- route: el endpoint que se llamó (/api/v1/socios, /api/v1/lockers, etc.)
- status: el código de respuesta (200, 201, 404, 500, etc.)

Para qué sirve: calcular la tasa de requests por segundo en Grafana.
Permite saber qué tan demandada está la API en cada momento y detectar
picos de tráfico inusuales.

---

**Errors — http.requests.errors**

Tipo: Counter. Igual que Rate pero solo suma cuando el request falló.
Se considera error cualquier respuesta con código 4xx (error del cliente)
o 5xx (error del servidor).

Labels:
- method: el verbo HTTP
- route: el endpoint que falló
- status: el código de error específico (400, 404, 500, 503, etc.)

Para qué sirve: calcular la tasa de error en Grafana dividiendo esta
métrica sobre el total de Rate. Si la tasa de error supera el 1%,
hay que investigar. Permite detectar problemas antes de que los usuarios
los reporten.

---

**Duration — http.request.duration**

Tipo: Histogram. A diferencia del Counter, un histograma no solo cuenta
sino que agrupa los valores en rangos (buckets) y permite calcular
percentiles.

¿Qué es un percentil? Si el p95 es 200ms, significa que el 95% de los
requests tardaron menos de 200ms. El 5% restante tardó más.
Esto es más útil que un promedio porque el promedio oculta los casos
extremos: si 99 requests tardan 10ms y 1 tarda 10 segundos,
el promedio es ~110ms pero el p99 muestra el problema real.

Unidad: milisegundos (ms)

Labels:
- method: el verbo HTTP
- route: el endpoint medido

Para qué sirve: identificar lentitud en la API. Se usan los percentiles
p95 y p99 en el dashboard de Grafana para ver la performance percibida
por los usuarios.

---

**Memoria — process.memory.usage**

Tipo: Gauge. Un medidor que sube y baja libremente, refleja el valor
actual en cada momento.

Descripción: mide cuántos bytes de RAM está usando el proceso Node.js
que corre la API. En Grafana se convierte a MB para que sea legible.

Para qué sirve: detectar memory leaks. Un memory leak ocurre cuando
la app consume cada vez más memoria sin liberarla. En Grafana se ve
como una línea que sube constantemente sin bajar nunca. Si no se detecta
a tiempo, el proceso crashea por falta de memoria.

---

**Requests activos — http.requests.active**

Tipo: Gauge. Mide cuántos requests se están procesando en simultáneo
en este momento exacto.

Para qué sirve: detectar saturación. Si este número sube mucho y no baja,
significa que la API está recibiendo más requests de los que puede procesar.
Es una señal de que se necesita escalar el servicio.

---

### b) OpenTelemetry SDK

La configuración conceptual del SDK para inyectar la telemetría en la API se estructurará de la siguiente manera:

```typescript
// packages/api/src/infrastructure/telemetry.ts

import { NodeSDK } from '@opentelemetry/sdk-node'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { metrics } from '@opentelemetry/api'

// 1. PrometheusExporter configurado para exponer métricas en el puerto 9464.
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
})

// 2. Crear el SDK con auto-instrumentaciones simplificadas
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    // Se deja vacío para evitar el error de tipos de TypeScript
    getNodeAutoInstrumentations(), 
  ],
})

sdk.start()     // Encender el SDK
console.log('[OTel] SDK iniciado — métricas disponibles en :9464/metrics')

// 3. Métricas personalizadas RED
const meter = metrics.getMeter('alentapp-api')

export const requestCounter = meter.createCounter('http.requests.total', {
  description: 'Total de requests HTTP recibidos por la API',
})

export const errorCounter = meter.createCounter('http.requests.errors', {
  description: 'Total de requests que fallaron (4xx o 5xx)',
})

export const requestDuration = meter.createHistogram('http.request.duration', {
  description: 'Latencia de cada request en milisegundos',
  unit: 'ms',
})

export const memoryGauge = meter.createObservableGauge('process.memory.usage', {
  description: 'RAM utilizada por el proceso Node.js en bytes',
})

memoryGauge.addCallback((result: any) => {
  result.observe(process.memoryUsage().heapUsed)    // Registra la memoria automáticamente
})

export const activeRequestsGauge = meter.createUpDownCounter('http.requests.active', {
  description: 'Cantidad de requests procesándose al mismo tiempo',
})

export { sdk, meter, prometheusExporter }
```

---

### c) Dashboard RED en Grafana

Diseño de los paneles para el monitoreo de la API:

| Panel | Métrica (Consulta PromQL) | Tipo de gráfico | Propósito |
| :--- | :--- | :--- | :--- |
| **1. Requests por segundo** | `rate(http_server_duration_count[1m])` | Time series | Ver el tráfico actual |
| **2. Tasa de error** | `sum(rate(...{status=~"5.."}[1m])) / sum(rate(...[1m]))` | Time series | % de errores |
| **3. Latencia p95/p99** | `histogram_quantile(0.95, ...)` | Time series | Performance percibida |
| **4. Por status code** | `sum by (status) (rate(...))` | Stacked area | Distribución de respuestas |
| **5. Memoria del proceso** | `process_memory_usage_bytes / 1024 / 1024` | Time series | Consumo de recursos |
| **6. Endpoints más lentos** | `topk(5, ...)` | Bar chart (horizontal) | Cuellos de botella |

#### Explicación técnica de las consultas (PromQL)

Para construir estos gráficos, Grafana utiliza PromQL (Prometheus Query Language) para consultar los datos almacenados. A continuación se explica la lógica detrás de cada métrica:

*   **1. Requests por segundo (`rate`):** La función `rate(...[1m])` calcula el promedio de peticiones por segundo evaluando los datos del último minuto. Traduce un contador acumulativo puro en una "tasa de velocidad" fácil de leer para entender la carga instantánea del servidor.
*   **2. Tasa de error (`status=~"5.."`):** Utiliza una expresión regular (`~"5.."`) para filtrar únicamente las peticiones que devolvieron un código de error de servidor (500, 502, 503, etc.). Luego, divide esa cantidad de errores por el total absoluto de peticiones recibidas, obteniendo así el porcentaje real de fallos de la API.
*   **3. Latencia p95/p99 (`histogram_quantile`):** PromQL calcula el percentil 95 (o 99) a partir de un histograma de latencias. Si el p95 es 150ms, significa que el 95% de las peticiones se resolvieron en 150ms o menos. Es una métrica mucho más precisa que el "promedio simple", ya que evita que los casos extremos (outliers) distorsionen la lectura del rendimiento real que percibe la mayoría de los usuarios.
*   **4. Agrupación por status code (`sum by (status)`):** La cláusula `by (status)` actúa como un "GROUP BY" de SQL. Agrupa la tasa de peticiones separándolas por su código de respuesta HTTP (200, 201, 400, 404). Esto permite construir un gráfico de área apilada para visualizar qué proporción del tráfico actual corresponde a éxitos y qué proporción a advertencias.
*   **5. Memoria del proceso (`/ 1024 / 1024`):** El exportador de telemetría envía el consumo de memoria RAM en bytes puros. La consulta divide ese valor dos veces por 1024 para transformarlo matemáticamente de Bytes a Megabytes (MB), facilitando la detección de *memory leaks* (fugas de memoria).
*   **6. Endpoints más lentos (`topk`):** La función `topk(5, ...)` (Top K elements) es un filtro de ordenamiento que evalúa todos los endpoints de la API, los ordena de mayor a menor según su tiempo medio de respuesta, y devuelve estrictamente los 5 peores. Es ideal para detectar cuellos de botella de forma automática.