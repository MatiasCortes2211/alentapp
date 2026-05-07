# TDD-0006: Eliminación de un Casillero (Locker)

- Estado: Propuesto
- Autor: Cemino Conrado
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El módulo gestiona los activos físicos del club (casilleros de vestuarios) que los socios pueden alquilar. El objetivo es realizar la baja lógica de un casillero específico del inventario del sistema. La "Baja" debe liberar el locker para que no figure como activo ni pueda ser utilizado por ningún socio.

### User Persona

- Administrativo: El usuario podrá retirar casilleros del inventario (por ejemplo, si un casillero se retira del vestuario permanentemente) mediante un borrado lógico para mantener la integridad histórica de los datos.

### Criterios de Aceptación
- Como administrativo, quiero dar de baja un casillero para removerlo del catálogo de activos disponibles.
    - Escenario de éxito: "Si el usuario solicita la eliminación de un casillero, el sistema responde con la eliminación lógica del recurso, modificando el estado `is_deleted` a `true` y liberando cualquier asignación a un socio".
    - Escenario de fallo: "Si el usuario intenta eliminar un casillero que no existe en la base de datos, el sistema debe dar error".
    - Escenario de fallo: "Si el usuario intenta eliminar un casillero que ya fue eliminado previamente, el sistema debe notificar el conflicto y rechazar la solicitud".

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
- Request Body (DeleteLocker): none
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
1. Puerto: `LockerRepository` (Interface en el Dominio para la abstracción de la persistencia).
2. Caso de Uso: `DeleteLocker` (Comprueba la existencia previa del casillero, verifica que no esté ya eliminado y aplica la lógica de desasignación).
3. Adaptador de Salida: DB persistence adapter.
4. Adaptador de Entrada: `LockerController` (Controlador HTTP).

### Lógica del Caso de Uso 
1. Validar que el parámetro `id` tenga un formato válido (ej. UUID).
2. Verificar en el repositorio que el Locker que se quiere eliminar existe (`findById`).
3. Comprobar que el casillero no tenga ya el flag `is_deleted` en `true`.
4. Aplicar los cambios en la entidad de dominio:
   - Establecer `is_deleted` = `true`.
   - Si el casillero tenía un socio asignado, la "Baja" debe liberar el locker para que las relaciones queden limpias. Se debe establecer `member_id` en `null`, `end_contract_date` en `null` y `status` a un estado neutro, previniendo inconsistencias.
5. Persistir la actualización (soft delete) a través del Repositorio.
6. Retornar código HTTP 200 sin contenido.

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Recurso inexistente                | Se intenta eliminar un ID de casillero que no existe en la base de datos. | 404 Not Found     |
| Registro ya eliminado              | Se intenta eliminar un casillero que ya tiene el campo `is_deleted` en `true`. | 409 Conflict      |
| Formato de ID inválido             | El ID enviado por parámetro no cumple con el formato esperado (ej. no es un UUID válido). | 400 Bad Request   |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres o error genérico de Prisma. | 500 Internal Server Error |