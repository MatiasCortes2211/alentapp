# Análisis Individual - Fase 1
**Alumno:** Rodrigo Castaño  
**Usuario:** rodricastanio  
**Materia:** Ingeniería y Calidad de Software 

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

