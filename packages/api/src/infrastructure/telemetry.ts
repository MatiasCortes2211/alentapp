import { NodeSDK } from '@opentelemetry/sdk-node'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { metrics } from '@opentelemetry/api'

// Configurar Prometheus Exporter
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
})

// Crear el SDK con auto-instrumentaciones simplificadas
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    // Se deja vacío para evitar el error de tipos de TypeScript
    getNodeAutoInstrumentations(), 
  ],
})

// Encender el SDK
sdk.start()
console.log('[OTel] SDK iniciado — métricas disponibles en :9464/metrics')

// Crear el meter
const meter = metrics.getMeter('alentapp-api')

// Métricas RED exportadas

export const requestCounter = meter.createCounter('http.requests.total', {
  description: 'Total de requests HTTP recibidos por la API',
})

export const errorCounter = meter.createCounter('http.requests.errors', {
  description: 'Total de requests que fallaron (4xx o 5xx)',
})

export const requestDuration = meter.createHistogram('http.request.duration', {
  description: 'Latencia de cada request en milisegundos',
  unit: 'ms',
})

export const memoryGauge = meter.createObservableGauge('process.memory.usage', {
  description: 'RAM utilizada por el proceso Node.js en bytes',
})

// Registrar la memoria automáticamente
memoryGauge.addCallback((result: any) => {
  result.observe(process.memoryUsage().heapUsed)
})

export const activeRequestsGauge = meter.createUpDownCounter('http.requests.active', {
  description: 'Cantidad de requests procesándose al mismo tiempo',
})

export { sdk, meter, prometheusExporter }

