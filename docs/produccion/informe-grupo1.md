# Informe de Verificaciones y documentación — Fase 4

**Grupo:** 1  
**Proyecto:** alentapp

---


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