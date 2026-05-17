# TDD-0005: Actualización de un Casillero (Locker)

- Estado: Aprobado
- Autor: Conrado Cemino
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El módulo gestiona los activos físicos del club (casilleros de vestuarios) que los socios pueden alquilar. El objetivo es modificar los datos de un casillero existente en el sistema, permitiendo actualizar su estado operativo (por ejemplo, pasarlo a Mantenimiento), su ubicación, o gestionar su alquiler (asignación/desasignación de un socio y modificación de su fecha de fin de contrato).

### User Persona

- Administrativo: El usuario podrá actualizar la información de los lockers en el inventario del club para reflejar su estado actual o modificar las condiciones de su alquiler.

### Criterios de Aceptación
- Como administrativo, quiero modificar los datos de un casillero para mantener el inventario del club actualizado.
    - Escenario de éxito: "Si el usuario modifica los datos de un casillero, el sistema responde con la actualización del recurso y guarda los cambios en la base de datos".
    - Escenario de fallo: "Si el usuario intenta cambiar el número del casillero por uno que ya está en uso por otro casillero, el sistema debe dar error y rechazar la modificación".
- Como administrativo, quiero asignar un casillero a un socio o cambiar su estado a mantenimiento.
    - Escenario de éxito: "El sistema verifica que el nuevo estado sea válido, actualiza el estado o asigna al socio, ajusta la fecha de fin de contrato si corresponde, y guarda el registro".
    - Escenario de fallo: "Si se intenta asignar a un socio a un casillero cuyo estado es (o pasará a ser) 'Maintenance', el sistema no permite la asignación y lanza un error".

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

- Endpoint: `PATCH /api/v1/lockers/:id`
- Request Body (UpdateLocker): 
```json
{
    "number"?: number;
    "location"?: 'Vestuario Masculino' | 'Vestuario Femenino' | 'Vestuario Niños';
    "status"?: 'Available' | 'Occupied' | 'Maintenance';
    "end_contract_date"?: string | null;
    "member_id"?: string | null;
}
```
- Response: 200 OK

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
2. Caso de Uso: `UpdateLocker` (Lógica que verifica la existencia previa del casillero, valida que el número no colisione con otro existente y comprueba reglas de estado y concurrencia).
3. Adaptador de Salida: DB persistence adapter.
4. Adaptador de Entrada: `LockerController` (Ruta HTTP).

### Lógica del Caso de Uso 
1. Validar los datos de entrada del DTO con Zod (ej. `number` > 0 si está presente, `status` válido).
2. Verificar en el repositorio que el Locker que se quiere actualizar existe (`findById`).
3. Si el request incluye un nuevo `number`, verificar en el repositorio que dicho número de casillero sea único y no pertenezca a otro casillero distinto.
4. Validar reglas de negocio para la asignación y estados:
   - Si se incluye un `member_id` (para asignación), verificar la existencia del socio.
   - Un casillero no puede asignarse si su status es o será "Maintenance".
   - Si se remueve el `member_id` (desasignación al pasar a `null`), la fecha de fin de contrato también debe anularse y el estado debe pasar a "Available" (o "Maintenance" si el usuario lo indica explícitamente).
   - Validar que si hay un socio asignado, la fecha de fin de contrato (`end_contract_date`) sea congruente.
5. Persistir el recurso a través del Repositorio. El sistema debe garantizar que un locker no se asigne a dos personas al mismo tiempo, manejando la concurrencia en caso de actualizaciones simultáneas (Race Conditions).
6. Retornar el `LockerResponse` actualizado con código HTTP 200.

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Recurso inexistente                | Se intenta modificar una ID de casillero que no existe en la base de datos. | 404 Not Found     |
| Conflicto de estado                | Un casillero no puede asignarse a un socio si su status es "Maintenance". | 400 Bad Request   |
| Número duplicado                   | El `number` de casillero debe ser único. No se puede actualizar a un número que ya usa otro locker. | 409 Conflict      |
| Socio inexistente                  | Cuando se intenta asignar el casillero a un `member_id` que no existe en la DB. | 404 Not Found     |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres o error en la resolución de concurrencia. | 500 Internal Server Error |