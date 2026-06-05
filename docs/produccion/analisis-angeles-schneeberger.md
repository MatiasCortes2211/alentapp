# Análisis de Infraestructura — Fase 1

**Alumno:** Angeles Schneeberger

**Proyecto:** alentapp

---

### 1.1. Analizar la infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **1. Exposición de credenciales críticas (Hardcoded)** | `docker-compose.yml` (Líneas 6-8, y Línea 30) | **Alto** | Remover las contraseñas en texto plano del archivo. Utilizar variables de entorno cargadas desde un archivo `.env` externo que esté debidamente incluido en el `.gitignore`. En el Compose solo deben quedar las referencias (ej. `POSTGRES_PASSWORD: ${DB_PASSWORD}`). |                                                                                                                              
| **2. Uso de imágenes de desarrollo en producción (Falta de Multi-stage Build)** | `packages/api/Dockerfile` y `packages/web/Dockerfile` (Todo el archivo) | **Alto** | Implementar **Multi-stage builds**. En la primera etapa (*build*) se instalan todas las dependencias y se compila el código (TypeScript/Vite). En la etapa final (*production*), se copian únicamente los artefactos distribuidos (`dist/`), los binarios de Prisma generados y las `dependencies` de producción, reduciendo drásticamente el tamaño de la imagen y la superficie de ataque. |                                                                                                          
| **3. Sin healthchecks en los servicios `api` y `web`** | `docker-compose.yml` — servicios `api` y `web` | **Alto** | Agregar una sección `healthcheck` en cada servicio que consulte un endpoint real de la aplicación. El servicio `db` tiene un healthcheck correctamente configurado, y la `api` lo usa con `depends_on: condition: service_healthy`. Sin embargo, la `api` y el `web` no tienen ninguno definido. Esto significa que Docker considera el contenedor "listo" en cuanto el proceso arranca, aunque la aplicación todavía esté inicializando o haya entrado en un estado de error silencioso. En producción, sin healthcheck, un contenedor que crasheó internamente sigue recibiendo tráfico porque desde afuera parece estar corriendo. |                                                                                                      
| **4. Contenedores ejecutándose como usuario Root (Vulnerabilidad de Seguridad)** | `packages/api/Dockerfile` y `packages/web/Dockerfile` (Por defecto al no declarar usuario) | **Alto** | La imagen base `node:20-alpine` corre como `root` por defecto. Si un atacante logra explotar una vulnerabilidad en la aplicación, obtiene acceso root dentro del contenedor, lo que facilita escalar privilegios o comprometer el host. Se debe añadir la instrucción `USER node` (aprovechando el usuario sin privilegios que ya viene en la imagen `node:20-alpine`) antes del comando de ejecución final. |                                                                                                                  
| **5. Ausencia de límites de recursos de hardware (CPU y Memoria)** | `docker-compose.yml` (Afecta a todos los servicios: `db`, `api`, `web`) | **Medio** | Sin límites definidos, un servicio con una fuga de memoria o un pico de tráfico puede consumir todos los recursos del host y derribar los demás contenedores. En producción es indispensable definir un techo para garantizar la estabilidad del sistema. Se debe configurar la sección `deploy.resources.limits` en cada servicio para restringir el consumo máximo de CPU y memoria (ej. `memory: 512M`). |

---

## 1.2 Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry:** Un framework de observabilidad diseñado para facilitar la generación, exportación y recopilación de datos de telemetría como trazas, métricas y logs. Es agnóstico del backend: no importa dónde se almacenen los datos, la API del código siempre es la misma. El almacenamiento (backend) y la visualización (frontend) de los datos de telemetría se dejan intencionadamente en manos de otras herramientas. Ademas es unificado, un solo SDK para trazas, métricas y logs. 

**Prometheus** en cambio es una herramienta específica: un sistema de almacenamiento y consulta de métricas que funciona mediante scraping (va a buscar métricas a cada servicio cada N segundos). Sirve para métricas, pero no maneja trazas ni logs.

La diferencia clave es de rol:

| | OpenTelemetry | Prometheus |
|---|---|---|
| **Qué es** | Estándar de instrumentación | Base de datos de métricas + scraper |
| **Qué recolecta** | Métricas, trazas y logs | Solo métricas |
| **Dónde vive** | En el código de la aplicación | En la infraestructura |
| **Almacena datos** | No — los envía a un backend | Sí |

---

### Los 3 pilares de la observabilidad

Los tres pilares son **métricas**, **trazas** y **logs**. Juntos permiten responder tres preguntas distintas sobre un sistema:

**Métricas** — *¿Qué está pasando ahora?*  
Números agregados en el tiempo: cuántos requests por segundo, cuánta memoria usa el proceso, cuántos errores hubo en la última hora. 

**Trazas** — *¿Por qué fue lento ese request específico?*  
Registro del recorrido completo de una request a través del sistema, con el tiempo que tomó cada paso. Permiten identificar dónde exactamente ocurrió un cuello de botella o un error.

**Logs** — *¿Qué pasó exactamente en ese momento?*  
Registro textual de eventos con contexto detallado. Son el nivel más granular: muestran el estado interno del sistema en un instante puntual.

---

### Métricas RED

Las métricas RED son un framework definido por Tom Wilkie para monitorear servicios orientados a requests.

**Rate (tasa)** — *¿Cuántas requests por segundo está procesando el servicio?*  
Indica la carga actual. Una caída brusca puede significar que el servicio dejó de recibir tráfico (o dejó de funcionar). Un pico puede anticipar problemas de capacidad.

**Errors (errores)** — *¿Qué porcentaje de esas requests termina en error?*  
Cualquier respuesta 4xx o 5xx cuenta. Un aumento en la tasa de errores es la señal más directa de que algo está fallando para los usuarios.

**Duration (duración)** — *¿Cuánto tarda cada request en completarse?*  
Se mide como percentiles (p50, p95, p99). El p99 es especialmente importante: muestra la experiencia del 1% de usuarios con peor performance, que suele ser donde se esconden los problemas reales.

---

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directo a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo nativo de OpenTelemetry para transmitir datos de telemetría entre componentes. Puede transportar los tres tipos de señal: métricas, trazas y logs en un solo canal.

La ventaja frente a exportar directamente a Prometheus es la **desacoplamiento del backend**:

- Con exportación directa a Prometheus, el código de la app tiene que saber que existe Prometheus, usar su formato (`/metrics` con texto Prometheus) y esperar que Prometheus haga scraping.
- Con OTLP, la app simplemente empuja los datos al **OTel Collector**, que actúa como intermediario. El Collector decide a dónde mandarlos: puede enviar métricas a Prometheus, trazas a Tempo, logs a Loki, y todo al mismo tiempo, sin tocar el código de la aplicación.

Esto significa que si mañana se quiere cambiar Prometheus por otro backend, el código no cambia: solo se reconfigura el Collector.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry y Grafana se complementan en roles distintos:

- **OpenTelemetry** instrumenta la aplicación y transporta los datos hasta los backends de almacenamiento.
- **Grafana** es la capa de visualización que consulta esos backends y muestra los datos en dashboards.

---
