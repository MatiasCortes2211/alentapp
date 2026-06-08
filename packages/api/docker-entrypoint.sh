#!/bin/sh
set -e
echo "==> Aplicando migraciones (prisma migrate deploy)..."
cd /app/packages/api
node /app/node_modules/.bin/prisma migrate deploy --config prisma.config.ts
cd /app
echo "==> Iniciando API..."
exec node --enable-source-maps ./packages/api/dist/app.js