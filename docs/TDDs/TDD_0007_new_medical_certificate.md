# TDD-0007: Registro de un Certificado Médico

- Estado: Propuesto
- Autor: Rodrigo Castaño
- Fecha: 2026-04-27

## Contexto de Negocio (PRD)

### Objetivo

Gestionar el registro y seguimiento de los certificados médicos de los socios para habilitarlos a realizar actividades físicas dentro del club.

### User Persona

- Socio: Quiere registrar su certificado médico en el sistema para cumplir con los requisitos del club y quedar habilitado para inscribirse y participar en las distintas disciplinas.

### Criterios de Aceptación
- Como socio, quiero cargar un certificado médico para poder hacer deporte.
    - Escenario de éxito: "Si el socio completa la carga de un nuevo certificado, el sistema debe guardarlo como el activo y automáticamente invalidar los registros anteriores de ese socio".
    - Escenario de fallo: "Si el socio intenta cargar un certificado que ya está vencido (fecha de vencimiento anterior a la actual), el sistema debe rechazar la petición y no permitir la carga del documento".

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
````

### Contrato de API (@alentapp/shared)

* Endpoint: `POST /api/v1/medical-certificates`
* Request Body(CreateMedicalCertificate):

```
{
    issue_date: Date;
    expiry_date: Date;
    doctor_license: string;
    member_id: string;
}
```

### Esquema de Persistencia

```
model MedicalCertificate {
    id String @id @default(uuid())
    issue_date DateTime @db.Date
    expiry_date DateTime @db.Date
    doctor_license String
    is_validated Boolean @default(false)
    member_id String
    Member Member @relation(fields: [member_id], references: [id])
}
```

## Arquitectura y Flujo

### Componentes de Arquitectura Hexagonal

1. Puerto: MedicalCertificateRepository (Interface en el Dominio).
2. Caso de Uso: CreateMedicalCertificate (Lógica que valida fechas, verifica la existencia del socio e invalida certificados previos).
3. Adaptador de Salida: PostgresMedicalCertificateRepository (Persistencia en BD con Prisma).
4. Adaptador de Entrada: MedicalCertificateController (Ruta HTTP).

### Lógica del Caso de Uso

1. Validar los datos de entrada.
2. Verificar la existencia del socio.
3. Comprobar que expiry_date sea mayor a issue_date.
4. Verificar que el certificado no esté vencido respecto a la fecha actual.
5. Invalidar certificados anteriores del socio.
6. Mapear DTO a Entidad de Dominio.
7. Persistir a través del Repositorio.

## Casos de Borde y Errores

| Escenario de Error       | Validación / Regla de Negocio                                 | Código HTTP               |
| ------------------------ | ------------------------------------------------------------- | ------------------------- |
| Datos faltantes          | Todos los campos requeridos deben estar presentes.            | 400 Bad Request           |
| Fechas inválidas         | expiry_date menor o igual a issue_date o fecha vencida.       | 400 Bad Request           |
| Socio inexistente        | El member_id no existe en la base de datos.                   | 404 Not Found             |
| Error de Infraestructura | Falla en la persistencia o al invalidar certificados previos. | 500 Internal Server Error |





