# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

Se detallan 5 problemas y vulnerabilidades identificados en la **infraestructura actual** respecto a las buenas prácticas para entornos productivos:

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **Datos sensibles hardcodeados:** Se exponen credenciales de la base de datos directamente en el código fuente, lo cual es una vulnerabilidad crítica si alguien obtiene acceso al repositorio. | `docker-compose.yml`: líneas 6-7 y 30 | Alto | Extraer los valores sensibles y utilizar variables de entorno inyectadas desde un archivo `.env` externo (ignorado en git) o utilizar Docker Secrets. |
| **Ausencia de Healthchecks en la aplicación:** Aunque la base de datos tiene su validación, la API y el Frontend carecen de ella. Si la API sufre un deadlock, Docker no lo detectará y le seguirá enviando tráfico de usuarios. | `docker-compose.yml`: servicios `api` y `web` | Medio | Agregar un bloque `healthcheck` a la API (ej. haciendo un `curl` a un endpoint `/health`) y actualizar la regla `depends_on` del frontend para que espere la condición `service_healthy` de la API.
| **Uso de servidor de desarrollo (Vite/Node) para servir el Frontend:** Se utiliza el servidor en caliente de Vite (`npm run dev`), el cual no está optimizado para alta concurrencia, caché ni compresión estática en producción. | `packages/web/Dockerfile`: línea 16 | Medio | Implementar un multi-stage build que compile los archivos estáticos (`vite build`) y luego utilizar un servidor web robusto y de alto rendimiento como Nginx (Alpine) para servirlos. |
| **Mapeo de código fuente mediante volúmenes (Bind Mounts):** Montar el directorio local (`.:/app`) rompe el principio de inmutabilidad de Docker. La imagen productiva debe ser un paquete cerrado e independiente; al usar bind mounts, el contenedor pasa a depender de los archivos físicos del servidor host. | `docker-compose.yml`: líneas 20 y 45 | Alto | Eliminar los mapeos de volúmenes de código local en el archivo productivo, garantizando que el código se empaquete exclusivamente a través de la instrucción `COPY` durante el build de la imagen. |
| **Ausencia de límites de recursos (Memory/CPU):** Ninguno de los servicios tiene restricciones de uso de hardware. Un memory leak en un contenedor puede consumir todos los recursos del servidor host, interrumpiendo todo el sistema. | `docker-compose.yml` (Nivel de servicio) | Medio | Definir restricciones de hardware especificando un bloque `deploy.resources` (con `limits` y `reservations` para CPU y memoria) en el compose file productivo. |


## 1.2. Investigar OpenTelemetry

**¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?**
* **OpenTelemetry (OTel):** Es un estándar (un conjunto de APIs, SDKs y herramientas) de código abierto diseñado para instrumentar, generar, recolectar y exportar datos de telemetría (métricas, logs y trazas) desde las aplicaciones.
* **Diferencia:** OpenTelemetry **no almacena ni visualiza** los datos. Prometheus, en cambio, es una base de datos de series temporales (Time Series Database) que se encarga de recolectar (scrapear) y almacenar a largo plazo esas métricas para poder consultarlas. 

**¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?**
* Los tres pilares fundamentales de la observabilidad son: **Métricas** (datos numéricos a lo largo del tiempo), **Logs** (registros de eventos específicos) y **Trazas** (el seguimiento del recorrido de una petición a través de múltiples microservicios).
* **OpenTelemetry aborda los tres pilares.** Aunque inicialmente nació enfocado en trazas y métricas, hoy en día es un estándar unificado capaz de instrumentar y exportar tanto Logs, como Métricas y Trazas bajo un mismo formato.

**Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?**
El método RED es un enfoque para monitorear servicios basándose en la experiencia del usuario y el tráfico.
* **Rate (Tasa):** Mide la cantidad de peticiones (requests) por segundo. Sirve para entender la carga o el tráfico real que está soportando el servicio.
* **Errors (Errores):** Mide la cantidad de peticiones que fallan (generalmente códigos de estado HTTP 4xx y 5xx). Sirve para monitorear la confiabilidad, la disponibilidad y detectar fallos internos rápidamente.
* **Duration (Duración):** Mide el tiempo que tarda el servicio en procesar y responder a una petición (latencia). Sirve para evaluar el rendimiento (performance) y asegurar que el sistema no se esté degradando bajo carga.

**¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?**
* **OTLP** es el protocolo de red nativo y estandarizado de OpenTelemetry utilizado para transmitir los datos de telemetría desde la aplicación hacia un recolector.
* **Ventaja:** Su mayor beneficio es ser agnóstico y vendor-neutral (no depende de una marca comercial). Si exportás directamente a Prometheus, acoplás el código de tu aplicación a una tecnología específica. Al usar OTLP, tu código simplemente "emite" datos en un formato estándar; luego, mediante un OpenTelemetry Collector, podés decidir enviar esa misma información a Prometheus, a Grafana, a Datadog, o a cualquier otra herramienta sin tener que modificar ni una sola línea de código en tu aplicación.

**¿Cómo se relaciona OpenTelemetry con Grafana?**
* Trabajan en conjunto formando un "pipeline" de observabilidad. OpenTelemetry es el motor que extrae los datos del código de la API. Esos datos viajan y se guardan en una base de datos (como Prometheus). Finalmente, **Grafana actúa como la capa de visualización**: se conecta a Prometheus, consulta esa información almacenada y permite construir tableros visuales interactivos (dashboards) y configurar alertas basadas en las métricas (como las RED) que OpenTelemetry recolectó originalmente.