# TDD-0015: Eliminación de un Deporte

- Estado: Propuesto
- Autor: Matias Cortes
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El módulo permite la eliminación lógica de una instancia específica de Sport. 

### User Persona

- Administrador. Debe realizar la Baja de una instancia específica de Sport, determinada por un ID pasado por parámetro.

### Criterios de Aceptación
- Como Administrador, quiero eliminar un deporte para removerlo del catálogo de deportes del sistema.
    - Escenario de éxito: "El sistema responde con la eliminación lógica de la instancia de Sport, modificando el estado is_deleted a True".
    - Escenario de fallo: "Si el administrador intenta eliminar un deporte inexistente, el sistema debe dar error".
    - Escenario de fallo: "Si el administrador intenta eliminar un deporte ya eliminado, el sistema debe dar error".
 

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

- Endpoint: `PATCH /api/v1/sports/:id`
- Request Body(DeleteSport): none
- Response: 204 No content (en caso de éxito)

### Esquema de Persistencia

```
model Sport {
	Id String @id @default(uuid())
	name String @unique
	description String
	max_capacity Int
	additional_price Float
	requires_medical_certificate Boolean
	is_deleted Boolean @default (false)
	enrollments Enrollment[]
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: SportRepository (Interface en el Dominio).
2. Caso de Uso: DeleteSport (Comprueba existencia previa del deporte usando findById). 
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).



### Lógica del Caso de Uso 
1. Verificar que el Sport que se quiere eliminar existe.
2. Verificar que el Sport no esté eliminado previamente.
3. Llamar al método de eliminación.
4. Retorna SportResponse con is_deleted: true y el mensaje 200 OK

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Recurso inexistente                    | Se quiere modificar, consultar o eliminar una ID que no existe.           | 404 Not Found    |
| Registro ya eliminado                | Si se intenta eliminar un deporte ya eliminada.                              | 409 Conflict   |
| Registro rechazado           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|