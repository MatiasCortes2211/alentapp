# TDD-0018: Eliminación lógica de un pago

- Estado: Aprobado
- Autor: Angeles Schneeberger
- Fecha: 2026-05-01

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos eliminar lógicamente un pago del sistema, sin borrarlo físicamente de la base de datos.

### User Persona

- Administrativo: el usuario podrá eliminar lógicamente un pago cuando este haya sido generado por error técnico o no deba formar parte de la operatoria del sistema. 

### Criterios de Aceptación
- Como administrativo, quiero eliminar un pago para que deje de aparecer en el sistema sin perder el registro en la base de datos 
    - Escenario de éxito: "Si el usuario elimina un pago existente que no está previamente eliminado, el sistema debe marcar el atributo is_deleted = true". 
    -  Escenario de fallo: "Si el usuario solicita la eliminación de un pago y este no existe, el sistema debe mostrar un mensaje de error indicando que el pago no fue encontrado". 
    - Escenario de fallo: "Si el usuario solicita la eliminación de un pago y este ya estaba eliminado, el sistema debe mostrar un mensaje de error indicando que ya fue eliminado". 

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
    is_deleted: boolean;
    member: Member;
}
```
```ts
enum PaymentStatus{
Pending = "PENDING",
Paid = "PAID",
Canceled = "CANCELED"	
}
```

### Contrato de API (@alentapp/shared) 

- Endpoint: `DELETE /api/v1/payments/:id`
- Request Body: none
- Response: 204 No content.

### Esquema de Persistencia

```prisma
model Payment {
	id String @id @default(uuid())
	amount Decimal
	month Int
	year Int
	status PaymentStatus @default(PENDING)
	due_date DateTime
	payment_date DateTime?
    is_deleted Boolean @default(false)
	member_id String
	member Member @relation(fields: [member_id], references: [id])
} 
```
```prisma
enum PaymentStatus {
  PENDING
  PAID
  CANCELED
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
2. Verificar que is_deleted = false
3. Aplicar cambio en la entidad de dominio 
4. Persistir a través del Repositorio. 

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| id invalido                        | El id debe tener formato UUID válido.                                        | 400 Bad Request   |
| Recurso inexistente                | Cuando se intenta eliminar un pago que no está en la DB.                     | 404 Not Found     |
| Pago ya eliminado                  | Un pago no puede ser eliminado nuevamente.                                | 409 Conflict      |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|

