# TDD-0011: Eliminación de una Disciplina

- Estado: Propuesto
- Autor: Paula Zacarías
- Fecha: 2026-05-03

## Contexto de Negocio (PRD)

### Objetivo

El objetivo del módulo es dar de baja a una sanción ya existente y asignada a un socio en el sistema. 
La baja de sanción es lógica, cuando el campo deleted de discipline es true, la sanción está eliminada. Se busca que la baja de la sanción se pueda llevar a cabo en casos de error en el alta.


### User Persona

- Administrativo: el usuario podrá realizar la eliminación de una sanción de un socio, permitiendo revertir sanciones registradas por error a través del borrado lógico.

### Criterios de Aceptación
- Como administrativo, quiero dar de baja una sanción de un socio para limpiar su historial de sanciones de registros erróneos.
    - Escenario de éxito: "Si el usuario completa la baja de una sanción, el sistema debe cambiar el campo deleted a true en la base de datos de la sanción. Además, debe dejar de mostrarle al usuario la sanción en los registros del socio”.
    - Escenario de fallo: "Si el usuario ingresa una sanción inexistente, el sistema debe notificar su inexistencia". 

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface Discipline {
    reason: string;
    start_date: date; 
    end_date: date;
    is_total_suspension: boolean;
    member_id: string; 
    is_deleted: boolean; 
}
```

### Contrato de API (@alentapp/shared) 

- Endpoint: `PATCH /api/v1/disciplines/:id`
- Request Body(DeleteDiscipline): none
- Response: 204 No content en caso de éxito.

### Esquema de Persistencia

```
model Discipline {
	Id String @id @default(uuid())
	reason String
	start_date DateTime
	end_date DateTime
	member_id: String
	member Member? @relation (fields: [member.id], references: [id])
	is_deleted boolean @default(false) 
} 
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal
1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: DeleteDiscipline (Comprueba existencia previa de la disciplina usando findById). 
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP).


### Lógica del Caso de Uso 
1. Validar los datos de entrada.
2. Verificar la existencia de la disciplina.
3. Verificar si ya está eliminada.
4. Comprobar las reglas de negocio.
5. Aplicar cambios en la entidad de dominio.
6. Persistir a través del Repositorio. 


## Casos de Borde y Errores

| Escenario de Error                  | Validación / Regla de Negocio                                            | Código HTTP       |
| --------------------------         | ---------------------------------------------                            | ------------------|
| Registro eliminado                    | Si se intenta eliminar una sanción ya eliminada.           | 409 Conflict   |
| Recurso inexistente                 | Cuando se intenta eliminar una sanción cuyo ID no está en la DB.                              | 404 Not Found   |
| Recurso equivocado                | Cuando se intenta eliminar una sanción cuyo ID es inválido.   | 400 Bad Request    |
| Error de Infraestructura           | Falla de conexión con el contenedor de Postgres.                         | 500 Internal Server Error|
