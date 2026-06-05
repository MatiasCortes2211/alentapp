### b) packages/web/Dockerfile.prod

#### Propósito

Este Dockerfile nos permitirá usar nginx para servir el frontend en producción, ya que esta es más rápida y liviana que Node.js, la cual usamos en desarrollo. Gracias al multi-stage build se puede usar Node.js y todas las herramientas de build en **etapas intermedias**, y copiar únicamente el resultado final (dist/) a la imagen de runtime.

#### Estructura

| Etapa | Nombre | Base | Propósito |
|---|---|---|---|
| Stage 1 | deps | node:22-alpine | Instalar dependencias |
| Stage 2 | build | node:22-alpine | Build de Vite (vite build) |
| Stage 3 | runtime | nginx:stable-alpine | Servir archivos estáticos con nginx |

**Stage 1: deps**\
Esta etapa instala las dependencias del proyecto. Copia únicamente los archivos package.json del monorepo raíz, de packages/web, y de packages/shared (es decir, antes de copiar el código fuente). Luego instala las dependencias (exactamente lo que está en el package-lock.json sin modificarlo).

**Stage 2: build**\
Ejecuta el script de build del workspace web. El cual compila TypeScript a JavaScript y luego empaqueta todo en el directorio dist/. Al terminar esta etapa, el resultado está en /app/packages/web/dist.

**Stage 3: runtime**\
Este stage es el de producción, el cual copia unicamente el directorio dist/ del stage anterior para que nginx pueda servir el frontend. Además, expone el puerto 80 y define un healthcheck que verifica periódicamente que nginx esté respondiendo correctamente en la configuración de nginx (packages/web/nginx.conf).

#### Requisitos no funcionales

**Tamaño máximo imagen final** ≤ 170 MB (reducción ≥ 70% respecto a ~570 MB dev)\
**No incluir herramientas de build** en la imagen final (tsc, vite, npm, eslint, vitest)\
**Servidor web nginx** para servir el frontend (no Node.js en producción)\
**Configurar compresión** gzip, cache de assets, y security headers\
**Healthcheck** contra localhost:80\
**Usuario sin root** (nginx corre sin root por defecto en nginx:stable-alpine)\
 