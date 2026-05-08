# TDD-0008: Modificación de un certificado médico

- **Estado**: Propuesto
- **Autor**: Rodrigo Castaño
- **Fecha**: 2026-04-27

## Contexto de Negocio (PRD)

### Objetivo

Gestionar la actualización de los datos de un certificado médico existente. Este proceso es indispensable para corregir errores de tipeo o de carga administrativa sin tener que eliminar y volver a crear el documento.


### User Persona

- Administrativo: Responsable de actualizar el estado del documento o corregir la fecha de vencimiento si hubo un error de tipeo en la carga inicial.

### Criterios de Aceptación

- Como administrativo, quiero actualizar el estado o la fecha de vencimiento de un certificado médico existente.
    - Escenario de éxito: "Si el administrativo modifica el estado o la fecha de vencimiento, el sistema debe actualizar el registro correctamente, siempre y cuando las nuevas fechas sean válidas."
    - Escenario de fallo: "Si se intenta asignar una fecha de vencimiento menor o igual a la de emisión original, el sistema debe rechazar la petición."

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

- **Endpoint**: `PATCH /api/v1/medical-certificates/:id`
- **Request Body**:
```json
{
    "is_validated": "boolean",
    "expiry_date": "string"
}
```
- **Response**: 200 OK con el objeto del certificado médico actualizado.

### Esquema de Persistencia
```prisma
model MedicalCertificate {
    id             String   @id @default(uuid())
    issue_date     DateTime 
    expiry_date    DateTime 
    doctor_license String
    is_validated   Boolean  @default(true)
    member_id      String
    member         Member   @relation(fields: [member_id], references: [id])
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal

1. **Puerto**: MedicalCertificateRepository (Interface en el Dominio para búsqueda y actualización parcial).
2. **Caso de Uso**: UpdateMedicalCertificate (Verifica la existencia y coordina la validación administrativa).
3. **Adaptador de Salida**: PostgresMedicalCertificateRepository (Aplica los cambios en PostgreSQL usando Prisma).
4. **Adaptador de Entrada**: MedicalCertificateController (Ruta HTTP PATCH).

### Lógica del Caso de Uso

1. Validar los datos de entrada parciales del DTO utilizando la librería Zod (solo permitiendo is_validated y/o expiry_date).
2. Verificar existencia del certificado mediante el ID provisto.
3. Si el certificado no existe (null), retornar error 404.
4. Combinar los datos existentes con los nuevos valores del Request Body (is_validated o expiry_date).
5. Si se envió una nueva expiry_date, re-validar obligatoriamente que sea estrictamente mayor a la issue_date original del registro.
6. Persistir los cambios a través del Repositorio.
7. Retornar el certificado actualizado.

## Casos de Borde y Errores

| Escenario de Error           | Validación / Regla de Negocio                                                                 | Código HTTP               |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| id inválido                  | El ID debe tener formato UUID válido.                                                         | 400 Bad Request           |
| Recurso inexistente          | Intento de modificar un certificado que no está en la base de datos.                          | 404 Not Found             |
| Datos inválidos              | El formato de los datos en el PATCH (fechas o booleano) no es el correcto.                    | 400 Bad Request           |
| Fechas inválidas             | Si al actualizar, la nueva fecha de vencimiento resulta menor o igual a la de emisión.        | 400 Bad Request           |
| Error de Infraestructura     | Falla de conexión con el contenedor de Postgres durante la actualización.                     | 500 Internal Server Error |