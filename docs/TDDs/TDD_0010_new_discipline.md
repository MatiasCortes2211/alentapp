# TDD-0010: Registro de una Disciplina

- Estado: Aprobado
- Autor: Paula Zacarías
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El objetivo del módulo es dar de alta a una sanción y asignarla a un socio ya existente.

### User Persona

- Administrativo: el usuario podrá registrar una sanción a un socio con fecha de inicio y fin de la misma.

### Criterios de Aceptación
- Como administrativo, quiero dar de alta una sanción a un socio para impedirle generar acciones en el sistema.
    - Escenario de éxito: "Si el usuario completa el alta de una sanción, el sistema debe responder con la creación con campo is_deleted en false, y la asignación de la misma al socio. Además, debe llevar a cabo el bloqueo al acceso de cualquier otra acción en el sistema al socio”. 
    - Escenario de fallo: "Si el usuario ingresa un socio inexistente, el sistema debe notificar la inexistencia del socio e impedir el alta de la sanción". 
    - Escenario de fallo: "Si el usuario ingresa una fecha de fin menor o igual a la fecha de inicio de la sanción, el sistema debe notificar el error de ingreso de datos e impedir el alta de la sanción". 

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface Discipline {
    reason: string;
    start_date: Date; 
    end_date: Date;
    is_total_suspension: boolean;
    member: Member; 
    is_deleted: boolean; 
}
```

### Contrato de API (@alentapp/shared) 

- Endpoint: `POST /api/v1/disciplines`
- Request Body(CreateDiscipline): 
```json
{
    "reason": string;
    "start_date": string;
    "end_date": string;
    "is_total_suspension": boolean;
	"member_id": string;
}
```

### Esquema de Persistencia

```prisma
model Discipline {
	id String @id @default(uuid())
	reason String
	start_date DateTime
	end_date DateTime
    is_total_suspension Boolean
	member_id String
	member Member @relation(fields: [member_id], references: [id])
	is_deleted Boolean @default(false) 
} 
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: CreateDiscipline (Lógica que verifica si el socio ya existe antes de llamar al repositorio, validan las fechas ingresadas, y verifica que la fecha de fin sea estrictamente mayor a la de inicio).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP).

### Lógica del Caso de Uso 
1. Validar los datos del DTO con Zod.
2. Verificar la existencia del socio.
3. Comprobar que la fecha de fin sea mayor a la fecha de inicio.
4. Comprobar las reglas de negocio.
5. Mapear DTO a Entidad de Dominio. 
6. Persistir a través del Repositorio. 

## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Datos faltantes                    | Todos los campos marcados como required deben estar presentes.           | 400 Bad Request   |
| Registro equivocado                | Cuando se intentan ingresar fechas iguales.                              | 400 Bad Request   |
| Recurso inexistente                | Cuando se intenta asignar una sanción a un socio que no está en la DB.   | 404 Not Found     |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|
