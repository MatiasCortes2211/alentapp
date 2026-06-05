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
