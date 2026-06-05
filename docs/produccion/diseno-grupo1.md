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