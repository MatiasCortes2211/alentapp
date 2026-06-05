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
