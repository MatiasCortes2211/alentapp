# TDD-0004: Registro de un Casillero (Locker)

- Estado: Propuesto
- Autor: Cemino Conrado
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El módulo gestiona los activos físicos del club (casilleros de vestuarios) que los socios pueden alquilar. El objetivo es registrar un nuevo casillero en el sistema, permitiendo opcionalmente su asignación inmediata a un socio si las reglas de negocio lo permiten.

### User Persona

- Administrativo: El usuario podrá dar de alta nuevos lockers en el inventario del club y gestionar su estado inicial o alquiler.

### Criterios de Aceptación
- Como administrativo, quiero dar de alta un nuevo casillero para que esté disponible en el catálogo de activos del club.
    - Escenario de éxito: "Si el usuario completa el alta con un número de casillero único, el sistema responde con la creación del recurso y lo guarda en la base de datos".
    - Escenario de fallo: "Si el usuario ingresa un número de casillero que ya existe, el sistema debe dar error y rechazar el registro".
- Como administrativo, quiero registrar y alquilar un casillero a un socio en un mismo paso.
    - Escenario de éxito: "El sistema verifica que el casillero esté en estado Disponible, asigna el socio, establece la fecha de fin de contrato y guarda el registro".
    - Escenario de fallo: "Si se intenta asignar a un socio pero el estado ingresado es Mantenimiento, el sistema no permite la asignación y lanza un error".

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
enum LockerStatus {
    AVAILABLE = 'Available',
    OCCUPIED = 'Occupied',
    MAINTENANCE = 'Maintenance'
}

enum LockerLocation {
    MALE = 'Vestuario Masculino',
    FEMALE = 'Vestuario Femenino',
    KIDS = 'Vestuario Niños'
}

interface Locker {
    number: number;
    location: LockerLocation;
    status: LockerStatus;
    end_contract_date?: Date | null;
    member?: Member | null;
    is_deleted: boolean;
}
```

### Contrato de API (@alentapp/shared) 

- Endpoint: `POST /api/v1/lockers`
- Request Body (CreateLocker): 
```json
{
    "number": number;
    "location": 'Vestuario Masculino' | 'Vestuario Femenino' | 'Vestuario Niños';
    "status": 'Available' | 'Occupied' | 'Maintenance';
    "end_contract_date": string | null;
    "member_id": string | null;
}
```
*(Nota: `end_contract_date` y `member_id` son opcionales si el casillero se crea sin asignar).*
- Response: 201 Created

### Esquema de Persistencia

```prisma
enum LockerStatus {
  Available
  Occupied
  Maintenance
}

enum LockerLocation {
  Male
  Female
  Kids
}

model Locker {
	id String @id @default(uuid())
	number Int
	location LockerLocation
	status LockerStatus @default(Available)
	end_contract_date DateTime?
	member_id String?
	member Member? @relation(fields: [member_id], references: [id])
    is_deleted Boolean @default(false)
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: `LockerRepository` (Interface en el Dominio para abstracción de persistencia).
2. Caso de Uso: `CreateLocker` (Valida disponibilidad de número, existencia del socio y reglas de concurrencia y estado).
3. Adaptador de Salida: DB persistence adapter.
4. Adaptador de Entrada: `LockerController` (Controlador HTTP).

### Lógica del Caso de Uso 
1. Validar la estructura de los datos de entrada mediante Zod (ej. `number` > 0, `status` válido).
2. Verificar en el repositorio que el `number` del casillero sea único.
3. Si el request incluye un `member_id` (Alta + Alquiler):
   - Verificar la existencia del socio en la base de datos.
   - Comprobar regla de negocio: Un casillero no puede asignarse si su status es "Maintenance". El "Alta" de un alquiler debe verificar que el locker esté "Disponible" (Available).
   - Validar que la fecha de fin de contrato (`end_contract_date`) sea mayor a la fecha actual.
4. Mapear el DTO a la Entidad de Dominio `Locker`.
5. Persistir el recurso a través del Repositorio. El sistema debe garantizar que un locker no se asigne a dos personas al mismo tiempo para evitar Race Conditions en el momento de la persistencia.
6. Retornar el `LockerResponse` con código HTTP 201.

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Datos faltantes / inválidos        | Los campos obligatorios (`number`, `location`) deben estar presentes y tener formato válido. | 400 Bad Request   |
| Conflicto de estado                | Un casillero no puede asignarse a un socio si su status es "Maintenance". | 400 Bad Request   |
| Número duplicado                   | El `number` de casillero debe ser único. No pueden existir dos lockers con el mismo número. | 409 Conflict      |
| Socio inexistente                  | Cuando se intenta asignar el casillero a un `member_id` que no existe en la DB. | 404 Not Found     |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres o error genérico de Prisma. | 500 Internal Server Error |