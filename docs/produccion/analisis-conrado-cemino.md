# Análisis e investigación - Conrado Cemino.

### 1.1. Análisis de la infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **1. Ejecución de servidores de desarrollo en producción** | `packages/api/Dockerfile` (línea 21) y `packages/web/Dockerfile` (línea 14) | **Alto** | Los comandos actuales (`npm run dev`) levantan Vite y TS-Node/Nodemon. Se debe compilar el código TypeScript a JavaScript puro y ejecutarlo con `node dist/app.js` en la API. En la web, se debe hacer el build estático y servirlo con un servidor web ligero y optimizado como **Nginx** en lugar de Node.js. |
| **2. Imágenes excesivamente pesadas y copia innecesaria de archivos** | Ambos Dockerfiles (`COPY . .`) | **Alto** | El comando `COPY . .` sin un filtro adecuado copia el código fuente, la carpeta `.git` y todas las dependencias locales. Se debe implementar **Multi-stage builds** (separando la instalación, el build y el runtime), usar un `.dockerignore` estricto e instalar solo dependencias de producción (`npm ci --omit=dev`). |
| **3. Ejecución de procesos con permisos de administrador (`root`)** | Ambos Dockerfiles (por omisión) | **Alto** | Por defecto, Docker ejecuta los contenedores como usuario `root`. Si un atacante vulnera la aplicación, tendrá control total sobre el contenedor. Se debe agregar explícitamente la directiva `USER node` al final de la etapa de runtime para ejecutar la app con un usuario sin privilegios. |
| **4. Variables de entorno sensibles ("Secrets") expuestas en texto plano** | `docker-compose.yml` (línea 30: `DATABASE_URL`) | **Medio / Alto** | Subir credenciales de bases de datos hardcodeadas al repositorio es un riesgo crítico. Las contraseñas deben removerse del `docker-compose.prod.yml` y pasarse de forma segura mediante un archivo `.env` ignorado en git. |
| **5. Falta de límites de recursos restrictivos** | `docker-compose.yml` (Servicios `api` y `web`) | **Medio** | Si la aplicación sufre una fuga de memoria (memory leak) o un ataque DDoS, consumirá todos los recursos del servidor host hasta tirarlo. Se deben definir límites de CPU/Memoria (`deploy.resources.limits`) y asignar `read_only: true` al filesystem para evitar la inyección de scripts. |

### 1.2. Investigación sobre OpenTelemetry

**¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?**
OpenTelemetry (OTel) es un estándar y conjunto de herramientas (SDKs, APIs) diseñado para *instrumentar, generar y exportar* datos de telemetría de una aplicación. OTel no almacena datos ni los visualiza. Por otro lado, Prometheus es una base de datos de series temporales (TSDB) diseñada específicamente para *almacenar y consultar* métricas. De mientras que OTel "recolecta", Prometheus "almacena".

**¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?**
Los tres pilares fundamentales son:
1. **Métricas:** Datos numéricos agregados a lo largo del tiempo (ej. uso de CPU, cantidad de peticiones).
2. **Logs:** Registros detallados de eventos con marcas de tiempo (ej. mensajes de error de la aplicación).
3. **Traces (Trazas):** El recorrido detallado de una petición a lo largo de un sistema distribuido (ej. cuánto tardó la API en responder y cuánto tardó la consulta a la base de datos).

OpenTelemetry **aborda los tres pilares**, proporcionando un estándar unificado para recolectar Métricas, Logs y Traces de manera consistente bajo un mismo protocolo.

**Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?**
El método RED es un enfoque centrado en la experiencia del usuario para monitorear servicios:
* **Rate (Tasa):** Número de peticiones por segundo. Sirve para medir el volumen de tráfico, entender la carga actual del sistema y prever picos de demanda.
* **Errors (Errores):** Cantidad o porcentaje de peticiones que fallan (ej. códigos HTTP 4xx o 5xx). Es crucial para alertar sobre la disponibilidad, confiabilidad y salud general del servicio.
* **Duration (Duración/Latencia):** Tiempo que tarda el sistema en responder a una petición (generalmente medida en percentiles como p95 o p99). Sirve para evaluar el rendimiento y la rapidez con la que el usuario percibe la aplicación.

**¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?**
OTLP es el protocolo de red oficial, de propósito general y estandarizado de OpenTelemetry para la transmisión de datos de telemetría.
La principal ventaja frente a exportar directamente a Prometheus es evitar el acoplamiento a una tecnología específica (**Vendor Lock-in**). Al usar OTLP, la aplicación envía datos en un formato estándar agnóstico. Si en el futuro se decide migrar de Prometheus a otra solución comercial (como Datadog o New Relic), **no es necesario modificar ni una sola línea de código en la aplicación**; simplemente se reconfigura el destino en la infraestructura.

**¿Cómo se relaciona OpenTelemetry con Grafana?**
Ambas herramientas trabajan en conjunto formando un pipeline completo de observabilidad. OpenTelemetry se encarga de la instrumentación y extracción de las métricas desde el código fuente de la aplicación y las exporta hacia un backend de almacenamiento (Prometheus). Luego, **Grafana se conecta a Prometheus** como fuente de datos (DataSource) para leer esas métricas y traducirlas en dashboards visuales, gráficos interactivos y alertas que el equipo puede monitorear en tiempo real.