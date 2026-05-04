# TDD-0004: Registro de un pago

- Estado: Propuesto
- Autor: Angeles Schneeberger
- Fecha: 2026-05-01

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo dé de alta un pago asociado a un miembro, representando la obligación de pago para un periodo  determinado.

### User Persona

- Administrativo: el usuario podrá registrar pagos asociados a un miembro, indicando el período (mes/año), monto y vencimiento, para mantener actualizada la situación económica del club. 

### Criterios de Aceptación
- Como Administrativo, quiero registrar un nuevo pago para mantener actualizadas las obligaciones del socio. 
    - Escenario de éxito: "Si el usuario completa los datos del pago correctamente, el sistema debe responder con un mensaje de éxito y crear el pago con esos datos y el estado pending y fecha de pago null".  
    - Escenario de fallo: "Si el usuario intenta registrar el pago omitiendo el monto (amount), la fecha de vencimiento (due_date), el mes (month) o el año (year), el sistema debe impedir la creación y señalar los campos requeridos".
    - Escenario de fallo: "Si el usuario ingresa un monto igual o menor a cero, el sistema debe mostrar un mensaje de error de validación".  
    - Escenario de fallo: "Si el usuario ingresa un miembro que no existe, el sistema debe mostrar un mensaje indicando que el miembro es inexistente y rechazar la operación".

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

- Endpoint: `POST /api/v1/payments`
- Request Body: 
```ts 
{
    amount: number; 
    month: number;
    year: number;
    due_date: string;
    member_id: string;
}
```

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
2. Caso de Uso: CreatePayment (Orquesta la creación de un Payment validando reglas de negocio).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: PaymentController (Ruta HTTP).

### Lógica del Caso de Uso 
1. Verificar existencia del miembro
2. Comprobar reglas de negocio (no deben existir dos pagos activos (estado pending o paid) para un miembro en un mismo mes y año).
3. Mapear DTO a Entidad de Dominio. 
4. Persistir a través del Repositorio.

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Datos faltantes                    | Todos los campos marcados como required deben estar presentes.           | 400 Bad Request   |
| Monto invalido                     | El monto debe ser mayor a cero.                                          | 400 Bad Request   |
| Recurso inexistente                | Cuando se intenta asignar un pago a un miembro que no está en la DB.    | 404 Not Found     |
| Registro duplicado                 | No pueden exisitr dos pagos con el mismo mes, año y miembro, y con estado activo (paid o pending) | 409 Conflict     |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|
