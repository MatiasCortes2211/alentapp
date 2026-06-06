# Análisis individual - Paula Zacarías

### 5 problemas o vulnerabilidades respecto a buenas prácticas de producción

| Problema | ¿Dónde Ocurre? | Impacto | Solución Propuesta |
|---|---|---|---|
| Corre como root, no se define usuario no-root | api/Dockerfile y web/Dockerfile | Alto | Agregar USER node en runtime |
| Node.js completo en producción, en runtime solo se necesita ejecutar el JS compilado, no todo Node.js | api/Dockerfile, web/Dockerfile | Alto | Usar multi-stage build: stage de build con node, stage runtime solo con el JS compilado |
| Variables sensibles hardcodeadas, POSTGRES_USER, POSTGRES_PASSWORD, DATABASE_URL con credenciales reales en texto plano | docker-compose.yml | Alto | Mover a archivo .env y referenciar |
| Sin límites de recursos |  CPU/memoria. Ningún servicio define limitación de los servicios | Medio | Agregar deploy.resources.limits con cpus y memory por servicio |
| Sin separación desarrollo-producción, y volúmenes de código fuente montados | docker-compose.yml, volumes de api y web | Medio | Crear docker-compose.prod.yml sin bind mounts, usando imagen compilada |

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
OpenTelemetry es un framework open-source que se usa para instrumentar aplicaciones, es decir, para que la aplicación genere información sobre lo que está haciendo: cuántos requests recibe, cuánto tarda en responder, si hay errores, etc.
La diferencia es que OpenTelemetry genera los datos y Prometheus los guarda, funciona complementariamente. Prometheus recolecta y guarda la información que genera OpenTelemetry.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
OpenTelemetry cubre los tres pilares de la observabilidad, los cuales son las métricas, los logs, y las trazas:\
Métricas: representan numéricamente el desempeño del sistema.\
Trazas: sigue el recorrido de una solicitud/operación a lo largo de varios componentes (no siempre es de punta a punta).\
Logs: son registros de los eventos ocurridos en el sistema.

### Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?
RED es un método para definir métricas, este usa tres: Rate, Errors, Duration. Sirve cuando no sabes donde empezar ni que métricas definir.\
Rate: cuántas solicitudes por segundo está recibiendo el servicio.\
Errors: cuántas de esas solicitudes están fallando.\
Duration: cuánto tarda el servicio en responder.

### Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?
OTLP es el protocolo que usa OpenTelemetry para enviar los datos que genera. En lugar de enviarlos directamente a Prometheus, los manda al Collector que después decide a dónde reenviarlos.
La ventaja es que si en algún momento se quiere cambiar o agregar una herramienta que no sea Prometheus, se modifica solo el Collector y no el código de la aplicación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?
Como se mencionó anteriormente, OpenTelemetry genera los datos, Grafana es una herramienta que se encarga de crear gráficos y dashboards para mostrar datos, en este caso, mostrar los datos generados por OpenTelemetry.