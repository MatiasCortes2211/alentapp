# Análisis Individual - Fase 1
**Alumno:** Rodrigo Castaño  
**Usuario:** rodricastanio  
**Materia:** Ingeniería y Calidad de Software 2026  
**Actividad:** TP Integrador - Actividad 4: Preparando para Producción

---

## 1.1 Análisis de la infraestructura Docker actual

Archivos analizados:
- `docker-compose.yml`
- `packages/api/Dockerfile`
- `packages/web/Dockerfile`

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|
| **Imágenes pesadas / sin multi-stage build** | `packages/api/Dockerfile:1` `packages/web/Dockerfile:1` | Alto — API pesa 1.52GB, Web 859MB. Se incluyen devDependencies, TypeScript y código fuente innecesarios en producción | Implementar multi-stage build: etapa `deps` instala dependencias, etapa `build` compila TypeScript, etapa `runtime` copia solo el JS compilado y dependencias de producción |
| **Credenciales hardcodeadas** | `docker-compose.yml:6-8` `docker-compose.yml:30` | Alto — usuario `admin` y contraseña `password123` expuestos en el repositorio. Cualquiera con acceso al repo obtiene acceso a la DB | Mover credenciales a un archivo `.env` (no commiteado) y referenciarlas con `${POSTGRES_PASSWORD}` en el compose |
| **Falta de healthchecks en api y web** | `docker-compose.yml` — servicios `api` y `web` | Medio — Docker no puede detectar si la API o el frontend están realmente funcionando o colgados, solo sabe si el contenedor está corriendo | Agregar `healthcheck` en `api` contra `localhost:3000` y en `web` contra `localhost:5173` |
| **Contenedores corren como root** | `packages/api/Dockerfile` `packages/web/Dockerfile` | Alto — si la aplicación es comprometida, el atacante obtiene acceso root dentro del contenedor | Agregar `RUN addgroup -S appgroup && adduser -S appuser -G appgroup` y `USER appuser` antes del `CMD` en ambos Dockerfiles |
| **Sin límites de recursos** | `docker-compose.yml` — ningún servicio | Medio — sin límites de CPU y memoria, un contenedor puede consumir todos los recursos del host y tumbar otros servicios | Agregar sección `deploy.resources` con `limits` de CPU y memoria a cada servicio |

---

## 1.2 Investigación de OpenTelemetry

### 1. ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry es un framework y conjunto de herramientas open source diseñado para facilitar la generación, exportación y recolección de datos de telemetría como métricas, logs y trazas. Uno de sus principales objetivos es permitir una instrumentación sencilla de las aplicaciones y sistemas, independientemente del lenguaje de programación, la infraestructura y el entorno de ejecución utilizados.

Con el auge de la computación en la nube y las arquitecturas de microservicios, la necesidad de observabilidad es mayor que nunca. OpenTelemetry satisface esa necesidad bajo dos principios clave: los datos que generás son tuyos, sin depender de ningún proveedor específico, y solo tenés que aprender un único conjunto de APIs y convenciones para capturar toda la telemetría de tu sistema.

La diferencia clave con Prometheus es que OpenTelemetry no es un backend de observabilidad en sí mismo, sino el estándar abierto para instrumentar y recolectar los datos. Prometheus, en cambio, es una herramienta específica de almacenamiento y consulta de métricas con su propio formato. Gracias a su naturaleza agnóstica, OpenTelemetry puede exportar datos hacia Prometheus entre muchos otros backends, actuando como una capa de instrumentación universal que no depende de ninguna herramienta particular para almacenar o visualizar los datos.

---

### 2. ¿Cuáles son los 3 pilares de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares fundamentales de la observabilidad son las métricas, los logs y las trazas:

- **Métricas:** Son mediciones del estado y rendimiento del sistema. Para saber por dónde empezar a medirlas, se usan frameworks como RED (tasa, errores y latencia, enfocado en la experiencia del usuario) o USE (utilización y saturación de recursos del hardware).

- **Logs:** Son registros descriptivos de los eventos que ocurren en el sistema. Para que sean útiles en la observabilidad, deben estar estructurados (por ejemplo, en formato JSON) e incluir identificadores y niveles de severidad como `error`, `info` o `warning`, en lugar de simples textos libres en consola que son difíciles de analizar.

- **Trazas:** Representan el recorrido completo de una petición de principio a fin a través de los diferentes componentes del sistema. Usan identificadores únicos como un `traceId` para correlacionarse con los logs y descubrir exactamente en qué punto de la arquitectura falló un proceso o en qué componente se generó un pico de latencia.

OpenTelemetry aborda los tres pilares de manera integral. Funciona como un estándar único que incluye herramientas específicas para cada pilar: un logger para capturar registros, un tracer para seguir el recorrido de las peticiones y recolectores para las métricas. Al implementarlo, los desarrolladores pueden capturar de manera unificada toda esta información y enviarla hacia herramientas de visualización como Grafana, Loki, Tempo o Mimir para analizar el estado del sistema en tiempo real.

---

### 3. ¿Qué son las métricas RED y para qué sirve cada una?

El método RED define tres métricas fundamentales para monitorear cada servicio: Rate, Errors y Duration.

- **Rate (Tasa):** es la cantidad de requests que el servicio está recibiendo por segundo. Permite saber qué tan demandado está el sistema en un momento dado.

- **Errors (Errores):** es la cantidad de esas requests que están fallando, ya sea por errores de cliente (4xx) o de servidor (5xx). Permite detectar problemas en tiempo real antes de que los usuarios los reporten.

- **Duration (Duración):** es el tiempo que tarda cada request en completarse, es decir, la latencia. Permite identificar cuellos de botella y degradaciones de rendimiento.

El método RED es un buen indicador del nivel de satisfacción de los usuarios: una tasa de error alta se traduce directamente en errores de carga de página para los usuarios, y una duración alta significa que el sitio es lento.

---

### 4. ¿Qué es OTLP y qué ventaja tiene frente a exportar directamente a Prometheus?

OTLP (OpenTelemetry Protocol) es el protocolo estándar de OpenTelemetry que define el formato y la forma en que los datos de telemetría se transmiten entre sistemas. Básicamente es el "idioma" común que hablan las aplicaciones instrumentadas con OpenTelemetry para mandar los datos a donde sea.

La ventaja frente a exportar directamente a Prometheus es la flexibilidad. Si instrumentás tu app directamente con Prometheus, quedás atado a su formato y solo podés enviar métricas — nada más. Si después necesitás agregar trazas o logs, tenés que incorporar librerías distintas para cada cosa y mantener todo eso por separado. Con OTLP en cambio, instrumentás una sola vez y con esa única configuración podés enviar métricas, logs y trazas a cualquier herramienta compatible — Prometheus, Grafana Cloud, Jaeger, lo que sea — sin tener que tocar el código de tu aplicación cada vez que cambiás de destino.

---

### 5. ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry y Grafana se complementan de la siguiente manera: OpenTelemetry es una colección de herramientas que ayuda a instrumentar, generar, recolectar y exportar datos de telemetría como métricas, logs y trazas en un formato estándar abierto. Grafana, por su parte, actúa como la capa de visualización que consume esos datos y los muestra en dashboards.

Grafana apoya activamente el desarrollo del proyecto OpenTelemetry, integrando soporte nativo dentro de su stack de herramientas: Loki para logs, Tempo para trazas y Mimir para métricas.

En la práctica, el flujo es: la aplicación instrumentada con OpenTelemetry genera métricas, logs y trazas → los exporta vía OTLP → cada herramienta del stack los almacena → Grafana los visualiza en tiempo real. OpenTelemetry recolecta y estandariza, Grafana muestra y permite analizar. Son herramientas distintas que trabajan juntas en la misma cadena de observabilidad.