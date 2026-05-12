# TDD-0011: Actualización de una Disciplina

- Estado: Propuesto
- Autor: Paula Zacarías
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El objetivo del módulo es modificar los campos de una sanción previamente existente en el sistema.


### User Persona

- Administrativo: el usuario podrá registrar el cambio de uno o varios datos de una sanción.

### Criterios de Aceptación
- Como administrativo, quiero modificar los datos de una sanción para guardar una versión actualizada de los mismos.
    - Escenario de éxito: "Si el usuario cambia un dato de una sanción, el sistema debe responder con un mensaje de éxito y la actualización de la sanción en la base de datos". 
    - Escenario de fallo: "Si el usuario cambia el socio por uno inexistente, el sistema debe notificar la inexistencia del socio e impedir la modificación de la sanción". 
    - Escenario de fallo: "Si el usuario cambia la fecha de fin por una previa o igual a la fecha de inicio, el sistema debe notificar el error e impedir la modificación de la sanción".
    - Escenario de fallo: "Si el usuario cambia la fecha de inicio por una posterior o igual a la fecha de fin, el sistema debe notificar el error e impedir la modificación de la sanción".

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

- Endpoint: `PATCH /api/v1/disciplines/:id`
- Request Body(UpdateDiscipline): 
```
{
    reason?: string;
    start_date?: string;
    end_date?: string;
    is_total_suspension?: boolean;
	member_id?: string;
}
```


### Esquema de Persistencia

```
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
2. Caso de Uso: UpdateDiscipline (Lógica que verifica si la sanción ya existe antes de llamar al repositorio mediante findById).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP).



### Lógica del Caso de Uso 
1. Validar los datos del DTO con Zod.
2. Comprobar existencia de la disciplina.
3. Comprobar que la disciplina no esté eliminada.
4. Comprobar que la fecha de fin sea mayor a la fecha de inicio si se modifica.
5. Comprobar las reglas de negocio.
6. Aplicar cambio a Entidad de Dominio. 
7. Persistir a través del Repositorio. 



## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Registro inválido                     | Cuando se intenta modificar una disciplina que ya fue eliminada.           | 409 Conflict   |
| Datos inválido                  | Los datos ingresados para modificar son inválidos.                    | 400 Bad Request  |
| Recurso inexistente                | Cuando se intenta eliminar una disciplina cuyo ID no está en la DB.   | 404 Not Found    |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|
