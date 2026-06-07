# Informe de Verificaciones y documentación — Fase 4

**Grupo:** 1  
**Proyecto:** alentapp

---

## 4.1. Verificación técnica

| Métrica | Antes (desarrollo) | Después (producción) | Mejora |
|---|---|---|---|
| Tamaño imagen API | 421 MB | 165 MB | 61% |
| Tamaño imagen Web | 220MB | 23.3MB | 89% |
| Tiempo de startup API | 0m19.198s | 0m13.528s | 29% |
| Memoria API (idle) | 107.6 MB (sin límite) | 72 MB / 512 MiB | 33% |
| Memoria Web (idle) | 376.7MiB / 6.649GiB | 12.72MiB / 256MiB | 96% |
| Endpoint API accesible | ✓ 200 OK | ✓ 200 OK | — |
| Frontend vía nginx | — | ✓ Documento HTML* | — |

```HTML
comando: curl localhost/

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web</title>
    <script type="module" crossorigin src="/assets/index-BJA5EXvJ.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

## 4.2. Verificación de seguridad

| Medida de seguridad | Estado | Verificación |
|---|---|---|
| API corre con usuario no-root | ✓ OK | `docker exec alentapp-api-prod whoami` → `node` |
| npm ausente en imagen final | ✓ OK | `docker exec alentapp-api-prod which npm` → vacío |
| tsc ausente en imagen final | ✓ OK | `docker exec alentapp-api-prod which tsc` → vacío |
| Filesystem read-only activo | ✓ OK | `docker exec alentapp-api-prod touch /test` → falla |
| Variables sensibles vía .env | ✓ OK | no hardcodeadas en Dockerfile ni docker-compose |
| Capabilities mínimas (cap_drop: ALL) | ✓ OK | configurado en docker-compose.prod.yml |
| Healthchecks funcionando | ✓ OK | `docker ps` → los 3 contenedores en estado `healthy`| 

![Contenedores healthy](./assets/contenedores-estado.png)

---

## 4.3 Verificación de Observabilidad (Dashboard RED)

Para verificar el correcto funcionamiento del pipeline de telemetría (OpenTelemetry $\rightarrow$ Prometheus $\rightarrow$ Grafana), se sometió a la API productiva a una prueba de carga controlada. Se utilizó un script automatizado que generó un flujo constante de tráfico sano (códigos 200) intercalado con peticiones de borrado inválidas (códigos 400/404) para forzar fallos en los controladores.

A continuación se presenta la evidencia de la reacción de la infraestructura ante el estrés:

![Dashboard RED - Reacción ante estrés de tráfico](./assets/dashboard-grafana.png)

Script utilizado:

```bash
for i in {1..300}; do
  # Tráfico sano (Éxitos 200)
  curl -s http://localhost:3000/api/v1/socios > /dev/null
  curl -s http://localhost:3000/api/v1/sports > /dev/null
  curl -s http://localhost:3000/api/v1/lockers > /dev/null
  
  # Tráfico roto (DELETE a un ID que no existe -> Error 400/404 real)
  curl -X DELETE -s http://localhost:3000/api/v1/socios/99999 > /dev/null
  
  sleep 0.05
done
```

Al analizar la captura del dashboard en tiempo real, se validaron los siguientes comportamientos:

1. **Requests por segundo:** La métrica `rate` capturó instantáneamente el inicio del ataque de tráfico simulado, graficando el incremento sostenido de peticiones hacia la API.
2. **Tasa de error (%):** El panel reflejó la división arquitectónica entre los contadores. El script enviaba 1 error por cada 3 éxitos. Como el contador `http_requests_total` registró estrictamente los éxitos, la fórmula ejecutada por Grafana (`1 error / 3 éxitos`) muestra una tasa de fallo que se estabilizó de forma precisa en el ~33%.
3. **Latencia p95:** El histograma calculó correctamente la *Duration*, permitiendo observar que, a pesar de la ráfaga de peticiones, el 95% de los usuarios experimentaron tiempos de respuesta óptimos de unos pocos milisegundos.
4. **Por status code:** El panel agrupó exitosamente las peticiones de `http_requests_total`. Se visualizan exclusivamente los códigos de éxito (ej. 200), demostrando que la instrumentación separó correctamente los códigos de advertencia (4xx/5xx) hacia el contador independiente de errores.
5. **Memoria del proceso:** El medidor de memoria demuestra que la API es estable a nivel de recursos. Durante la prueba de estrés, el consumo de RAM no se disparó sin control ni colapsó el servidor, sino que se mantuvo en niveles normales y equilibrados, confirmando que la aplicación libera correctamente la memoria que ya no utiliza (sin fugas de memoria).
6. **Endpoints más lentos:** La función de agregación agrupó los promedios de tiempo por cada `route`, generando un top 5 en formato de tabla que permitió visualizar con precisión la latencia de, en este caso, las 4 rutas específicas que fueron sometidas a la prueba de carga.