# TDD-0017: Actualización de un pago

- Estado: Propuesto
- Autor: Angeles Schneeberger
- Fecha: 2026-05-01

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administradores actualizar el estado de un pago para marcarlo como paid. 

### User Persona

- Administrativo: el usuario podrá actualizar pagos cuando el socio abona (estado paid). 


### Criterios de Aceptación
- Como administrativo, quiero marcar un pago como paid para registrar que el socio abonó su pago correspondiente. 
    - Escenario de éxito: "Si el usuario ingresa un pago que existe y está en estado pending, el sistema debe responder completando la fecha de pago con la fecha actual y cambiando el estado a paid"
    - Escenario de fallo: "Si el usuario ingresa un pago que no existe, el sistema debe mostrar un mensaje de error, indicando que el pago no existe en la base de datos". 
    - Escenario de fallo: "Si el usuario ingresa un pago que está en estado canceled o paid, el sistema debe mostrar un mensaje de error, indicando el estado actual del mismo". 

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

- Endpoint: `PATCH /api/v1/payments/:id/update`
- Request Body: none

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
	member Member @relation(fields: [member_id], references: [id])
} 
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: PaymentRepository (Interface en el Dominio).
2. Caso de Uso: UpdatePayment.
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: PaymentController (Ruta HTTP).

### Lógica del Caso de Uso 
1. Verifica existencia del pago
2. Comprobar reglas de negocio (Si el pago ya está cancelado o pagado, no puede modificarse). 
3. Aplicar cambio en la entidad de dominio 
4. Persistir a través del Repositorio. 

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                               | Código HTTP       |
| --------------------------         | ---------------------------------------------                                | ------------------|
| id invalido                        | El id debe tener formato UUID válido.                                        | 400 Bad Request   |
| Recurso inexistente                | Cuando se intenta modificar un pago que no está en la DB.                  | 404 Not Found     |
| Pago ya está en estado paid        | Un payment no puede ser modificado porque ya se encuentra en estado paid     | 409 Conflict      |
| Pago ya está en estado canceled    | Un payment no puede ser modificado porque ya se encuentra en estado canceled | 409 Conflict      |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                             | 500 Internal Server Error|
