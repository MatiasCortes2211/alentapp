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
