# TDD-0008: Modificación de un certificado médico

- **Estado**: Propuesto
- **Autor**: Rodrigo Castaño
- **Fecha**: 2026-04-27

## Contexto de Negocio (PRD)

### Objetivo

Gestionar la actualización de los datos de un certificado médico existente y permitir su validación administrativa. Este proceso es indispensable para habilitar legalmente a los miembros a realizar actividades físicas dentro del club.


### User Persona

- **Administrativo**: Responsable de revisar el documento físico o digital y otorgar la validación oficial en el sistema.

### Criterios de Aceptación

- Como administrativo, quiero validar o corregir un certificado para habilitar al socio en sus actividades deportivas.
    - **Escenario de éxito**: "Si el administrativo marca el campo is_validated como verdadero, el sistema debe actualizar el registro y el socio quedará habilitado (siempre que no esté vencido)".
    - **Escenario de fallo**: "Si se intenta modificar un certificado médico que no se encuentra registrado en la base de datos, el sistema debe retornar un mensaje de error 404".

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
```ts
export interface UpdateMedicalCertificate {
    is_validated?: boolean;
    expiry_date?: Date;
}
```
- **Response**: 200 OK con el objeto del certificado médico actualizado.

### Esquema de Persistencia
```prisma
model MedicalCertificate {
    id             String   @id @default(uuid())
    issue_date     DateTime @db.Date
    expiry_date    DateTime @db.Date
    doctor_license String
    is_validated   Boolean  @default(false)
    member_id      String
    Member         Member   @relation(fields: [member_id], references: [id])
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal

1. **Puerto**: MedicalCertificateRepository (Interface en el Dominio para búsqueda y actualización parcial).
2. **Caso de Uso**: UpdateMedicalCertificate (Verifica la existencia y coordina la validación administrativa).
3. **Adaptador de Salida**: PostgresMedicalCertificateRepository (Aplica los cambios en PostgreSQL usando Prisma).
4. **Adaptador de Entrada**: MedicalCertificateController (Ruta HTTP PATCH).

### Lógica del Caso de Uso

1. Verificar existencia del certificado mediante el ID provisto.
2. Si el certificado no existe (null), retornar error 404.
3. Combinar los datos existentes con los nuevos valores del Request Body (is_validated o expiry_date).
4. Persistir los cambios a través del Repositorio.
5. Retornar el certificado actualizado.

## Casos de Borde y Errores

| Escenario de Error           | Validación / Regla de Negocio                                                                 | Código HTTP               |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| id inválido                  | El ID debe tener formato UUID válido.                                                         | 400 Bad Request           |
| Recurso inexistente          | Intento de modificar un certificado que no está en la base de datos.                          | 404 Not Found             |
| Datos inválidos              | El formato de los datos en el PATCH (fechas o booleano) no es el correcto.                    | 400 Bad Request           |
| Error de Infraestructura     | Falla de conexión con el contenedor de Postgres durante la actualización.                     | 500 Internal Server Error |