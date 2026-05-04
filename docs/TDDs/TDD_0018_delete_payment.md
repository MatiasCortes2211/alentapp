# TDD-0018: Anulación de un pago

- Estado: Propuesto
- Autor: Angeles Schneeberger
- Fecha: 2026-05-01

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos anular un pago registrado sin eliminarlo físicamente de la base de datos, el borrado es solamente lógico, el estado del pago pasa a canceled. 

### User Persona

- Administrativo: el usuario podrá anular un pago cargado incorrectamente, sin perder el historial de pagos.

### Criterios de Aceptación
- Como administrativo, quiero anular un pago para corregir errores sin eliminar el historial de pagos.  
    - Escenario de éxito: "Si el usuario completa la anulación de un pago que existe y está en estado pending, el sistema debe responder con el pago y su cambio de estado a canceled".  
    -  Escenario de fallo: "Si el usuario solicita la anulación de un pago y este no existe, el sistema debe mostrar un mensaje de error indicando que el pago no fue encontrado". 
    - Escenario de fallo: "Si el usuario solicita la anulación de un pago y este se encuentra en estado paid o canceled, el sistema debe mostrar un mensaje de error indicando que el pago no puede ser anulado porque ya se encuentra en un estado inactivo". 

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface Payment {
    amount: number; 
    month: number;
    year: number;
    status: PaymentStatus;
    due_date: Date;
    payment_date?: Date; 
    member: Member;
}
```
```ts
enum PaymentStatus{
pending = "PENDING",
paid = "PAID",
canceled = "CANCELED"	
}
```

### Contrato de API (@alentapp/shared) 

- Endpoint: `PATCH /api/v1/payments/:id/delete`
- Request Body: none
- Response: 204 No content en caso de éxito. 

### Esquema de Persistencia

```prisma
model Payment {
	id String @id @default(uuid())
	amount Decimal
	month Int
	year Int
	status String
	due_date DateTime
	payment_date DateTime?
	member_id String
	member Member @relation (fields: [member_id], references: [id])
} 
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: PaymentRepository (Interface en el Dominio).
2. Caso de Uso: DeletePayment.
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: PaymentController (Ruta HTTP).

### Lógica del Caso de Uso 
1. Verificar existencia del pago
2. Comprobar reglas de negocio (Si el pago ya está cancelado o ya está pagado, no puede cancelarse el pago). 
3. Aplicar cambio en la entidad de dominio 
4. Persistir a través del Repositorio. 

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| id invalido                        | El id debe tener formato UUID válido.                                        | 400 Bad Request   |
| Recurso inexistente                | Cuando se intenta anular un pago a que no está en la DB.                     | 404 Not Found     |
| Pago ya está en estado paid        | Un payment no puede ser cancelado porque ya se encuentra en estado paid.     | 409 Conflict      |
| Pago ya está en estado canceled    | Un payment no puede ser cancelado porque ya se encuentra en estado canceled. | 409 Conflict      |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|

