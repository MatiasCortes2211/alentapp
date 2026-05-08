# TDD-0007: Registro de un Certificado Médico

- Estado: Propuesto
- Autor: Rodrigo Castaño
- Fecha: 2026-04-27

## Contexto de Negocio (PRD)

### Objetivo

Gestionar el registro y seguimiento de los certificados médicos de los socios para habilitarlos a realizar actividades físicas dentro del club.

### User Persona

- Administrativo: Quiere registrar el certificado médico de un socio en el sistema para cumplir con los requisitos del club y dejarlo habilitado para inscribirse y participar de los distintos deportes.

### Criterios de Aceptación
- Como administrativo, quiero cargar el certificado médico de un socio para que pueda hacer deporte.
    - Escenario de éxito: "Si el administrativo completa la carga de un nuevo certificado, el sistema debe guardarlo como el activo (con estado true) y automáticamente invalidar los registros anteriores de ese socio (pasándolos a false)."
    - Escenario de fallo: "Si el administrativo intenta cargar un certificado que ya está vencido (fecha de vencimiento anterior a la actual), el sistema debe rechazar la petición y no permitir la carga del documento."

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

* Endpoint: `POST /api/v1/medical-certificates`
* Request Body(CreateMedicalCertificate):

```json
{
    "issue_date": "string",
    "expiry_date": "string",
    "doctor_license": "string",
    "member_id": "string"
}
```

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

1. Puerto: MedicalCertificateRepository (Interface en el Dominio).
2. Caso de Uso: CreateMedicalCertificate (Lógica que valida fechas, verifica la existencia del socio e invalida certificados previos).
3. Adaptador de Salida: PostgresMedicalCertificateRepository (Persistencia en BD con Prisma).
4. Adaptador de Entrada: MedicalCertificateController (Ruta HTTP).

### Lógica del Caso de Uso

1. Validar los datos de entrada del DTO con Zod.
2. Verificar la existencia del socio.
3. Comprobar que expiry_date sea mayor a issue_date.
4. Verificar que el certificado no esté vencido respecto a la fecha actual.
5. Establecer el estado del nuevo certificado en true (vigente) e invalidar automáticamente todos los certificados anteriores del socio pasándolos a estado false.
6. Mapear DTO a Entidad de Dominio.
7. Persistir a través del Repositorio.

## Casos de Borde y Errores

| Escenario de Error       | Validación / Regla de Negocio                                 | Código HTTP               |
| ------------------------ | ------------------------------------------------------------- | ------------------------- |
| Datos faltantes          | Todos los campos requeridos deben estar presentes.            | 400 Bad Request           |
| Fechas inválidas         | La fecha de vencimiento (expiry_date) debe ser posterior a la fecha de emision (issue_date) y posterior a la fecha actual       | 400 Bad Request           |
| Socio inexistente        | El member_id no existe en la base de datos.                   | 404 Not Found             |
| Error de Infraestructura | Falla en la persistencia o al invalidar certificados previos.| 500 Internal Server Error |





