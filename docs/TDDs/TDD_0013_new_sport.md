# TDD-0013: Registro de un Deporte

- Estado: Aprobado
- Autor: Matias Cortes
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El módulo permite crear una instancia de Sport, configurando su cupo máximo, precio adicional, descripción y la necesidad de certificado médico. Es la entidad "maestra" que define las condiciones que luego la inscripción (Enrollment) debe respetar.

### User Persona

- Administrador. Debe realizar el Alta de una instancia de Sport considerando las restricciones de max_capacity > 0 y la inmutabilidad del name una vez creado.

### Criterios de Aceptación
- Como Administrador, quiero crear un deporte para que los socios puedan inscribirse.
    - Escenario de éxito: "Si el administrador completa los datos del Alta y la capacidad máxima es > 0, el sistema responde con una instancia de Sport con is_deleted en false".
    - Escenario de fallo: "Si el administrador ingresa una capacidad máxima <= 0, el sistema no debe dar de Alta una instancia de Sport y retorna un error". 
 

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface Sport {
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
    is_deleted : boolean;
}

```

### Contrato de API (@alentapp/shared) 

- Endpoint: `POST /api/v1/sports`
- Request Body (CreateSport): 
```json
{
	"name": string;
	"description": string;
	"max_capacity": number;
	"additional_price": number;
	"requires_medical_certificate": boolean;
}
```
- Response: 201 Created

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
2. Caso de Uso: createSport (Lógica que verifica si el name ya existe antes de llamar al repositorio, valida datos y verifica que max_capacity sea mayor a 0).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).


### Lógica del Caso de Uso 
1. Validar los datos del DTO con Zod.
2. Comprobar reglas de negocio:
	- No pueden existir dos instancias de Sport con el mismo nombre.
	Esta regla de negocio solo tiene en cuenta instancias de Sport con is_deleted en false. El sistema debe permitir la reutilización de un nombre de una instancia de Sport que ya fue eliminada. Por este motivo, name no puede ser unique, sino que se debe hacer la validación a través de una función propia.
	- max_capacity debe ser mayor a 0.
	- El Sport inicia con is_deleted en false por defecto.
3. Mapear DTO a Entidad de Dominio.
4. Persistir a través del Repositorio.
5. Retornar SportResponse.

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Datos faltantes                    | Todos los campos marcados como required deben estar presentes.           | 400 Bad Request   |
| max_capacity inválido (create)                | max_capacity debe ser mayor a 0.                              | 400 Bad Request   |
| name duplicado                | No pueden existir dos instancias de Sport con el mismo nombre.   | 409 Conflict     |
| Registro rechazado           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|