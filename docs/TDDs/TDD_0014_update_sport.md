# TDD-0014: Actualización de un Deporte

- Estado: Aprobado
- Autor: Matias Cortes
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El módulo modificar una instancia de Sport, pudiendo actualizar únicamente su cupo máximo (max_capacity > 0 y max_capacity >= inscriptos activos) y descripción. Es la entidad "maestra" que define las condiciones que luego la inscripción (Enrollment) debe respetar.

### User Persona

- Administrador. Debe realizar la modificación de una instancia específica de Sport, pasando el id y los cambios que se quieran realizar.

### Criterios de Aceptación
- Como Administrador, quiero modificar la descripción o el cupo máximo de un deporte ya existente.
    - Escenario de éxito: "Si el administrador completa los datos a actualizar de descripción y/o cupo máximo (max_capacity > 0 y max_capacity >= inscriptos activos), el sistema responde con la actualización de la instancia existente de Sport".
    - Escenario de fallo: "Si el administrador ingresa una capacidad máxima <= 0, el sistema no debe permitir su actualización y lanzará un error". 
	- Escenario de fallo: "Si el administrador quiere modificar el nombre del deporte, el sistema no debe permitir su actualización y lanzará un error".
	- Escenario de fallo: "Si el administrador quiere modificar el monto adicional del deporte, el sistema no debe permitir su actualización y lanzará un error".
	- Escenario de fallo: "Si el administrador quiere modificar la exigencia de certificacio médico del deporte, el sistema no debe permitir su actualización y lanzará un error".

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface Sport {
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
    is_deleted: boolean;
}
```

### Contrato de API (@alentapp/shared) 

- Endpoint: `PATCH /api/v1/sports/:id`
- Request Body (UpdateSport): 
```json
{
	"description"?: string;
	"max_capacity"?: number;
{
```
- Response: 200 OK

### Esquema de Persistencia

```prisma
model Sport {
	id String @id @default(uuid())
	name String
	description String
	max_capacity Int
	additional_price Float
	requires_medical_certificate Boolean
	is_deleted Boolean @default(false)
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: SportRepository (Interface en el Dominio).
2. Caso de Uso: UpdateSport (Lógica que verifica el cumplimiento de las reglas de negocio antes de llamar al repositorio, valida datos).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).


### Lógica del Caso de Uso 
1. Validar los datos del DTO con Zod (max_capacity > 0).
2. Verificar que existe el Sport que se quiere actualizar
3. Comprueba las reglas de negocio:
	- El nombre es inmutable luego de la creación de un deporte.
	- La max_capacity debe ser mayor a 0.
4. Persistir a través del Repositorio.
5. Retornar SportResponse.

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Recurso inexistente                    | Si se quiere modificar un deporte con ID que no existe.           | 404 Not Found    |
| name duplicado                    | No pueden existir dos instancias de Sport con el mismo nombre.           | 409 Conflict    |
| max_capacity inválido                    | max_capacity debe ser mayor a 0 y no puede ser menor a la cantidad de inscriptos activos.           | 400 Bad Reques    |
| Intento de modificar name                    | El atributo name es inmutable después de la creación.           | 400 Bad Reques    |
| Registro ya eliminado                | Si se intenta modificar un deporte ya eliminada.                              | 409 Conflict   |
| Registro rechazado           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|