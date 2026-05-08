# TDD-0009: Eliminación de un certificado médico

- **Estado**: Propuesto
- **Autor**: Rodrigo Castaño
- **Fecha**: 2026-04-27

## Contexto de Negocio (PRD)

### Objetivo

Proveer la capacidad de eliminar físicamente un registro de certificado médico de la base de datos en situaciones específicas, como errores humanos de carga, duplicación accidental o ingreso de datos en el socio equivocado.

### User Persona

- Administrativo: El usuario podrá anular un certificado cargado incorrectamente para mantener la integridad de la información del socio.

### Criterios de Aceptación

- Como administrativo, quiero eliminar un certificado cargado por error para limpiar el legajo médico del socio.
    - Escenario de éxito: "Si el administrativo confirma la eliminación de un ID de certificado válido, el sistema debe removerlo físicamente de la base de datos y retornar una confirmación exitosa".
    - Escenario de fallo: "Si el usuario solicita la eliminación de un certificado y este no existe, el sistema debe mostrar un mensaje de error indicando que el certificado no fue encontrado".

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface MedicalCertificate {
    issue_date: Date;
    expiry_date: Date;
    doctor_license: string;
    is_validated: boolean;
    member: Member;
}
```

### Contrato de API (@alentapp/shared)

- **Endpoint**: `DELETE /api/v1/medical-certificates/:id`
- **Request Body**: none
- **Response**: 204 No Content en caso de éxito.

### Esquema de Persistencia

```prisma
model MedicalCertificate {
    id String @id @default(uuid())
    issue_date DateTime @db.Date
    expiry_date DateTime @db.Date
    doctor_license String
    is_validated Boolean @default(true)
    member_id String
    member Member @relation(fields: [member_id], references: [id])
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal

1. **Puerto**: MedicalCertificateRepository (Interface en el Dominio que define las operaciones de búsqueda y eliminación física).
2. **Caso de Uso**: DeleteMedicalCertificate (Lógica de aplicación que orquesta la baja, verificando existencia previa).
3. **Adaptador de Salida**: PostgresMedicalCertificateRepository (Implementación real en BD que ejecuta el borrado físico usando Prisma).
4. **Adaptador de Entrada**: MedicalCertificateController (Ruta HTTP que captura el ID de la URL).

### Lógica del Caso de Uso

1. Extraer el ID del parámetro de la URL y validar su formato (UUID) utilizando la librería Zod.
2. Verificar existencia del certificado médico.
3. Si el método devuelve null, el flujo se interrumpe y se lanza una excepción de tipo "Recurso no encontrado" (404).
4. Se llama al método delete(id) del repositorio para remover físicamente el registro de la tabla en Postgres.
5. Se devuelve una respuesta con código de estado HTTP 204 No Content para indicar éxito.

## Casos de Borde y Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
| :--- | :--- | :--- |
| id inválido | El id debe tener formato UUID válido. | 400 Bad Request |
| Recurso Inexistente | Cuando se intenta eliminar un certificado que no está en la DB. | 404 Not Found |
| Conflicto de integridad | Si el certificado posee dependencias en otras tablas que impiden su borrado físico. | 409 Conflict |
| Error de Infraestructura | Falla de conexión con el motor de base de datos durante el borrado. | 500 Internal Server Error |

