import type { MedicalCertificateDTO, CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const medicalCertificateService = {
  // 1. Crear Certificado Original
  async create(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || errorData.error || 'Error al registrar el certificado';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  },

  // 2. Obtener historial por Socio
  async getByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/medical-certificates/member/${memberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Error al obtener los certificados');
    }

    const result = await response.json();
    return result.data;
  },

  // 3. Modificar Validación/Vencimiento
  async update(id: string, data: UpdateMedicalCertificate): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Error al actualizar el certificado');
    }

    const result = await response.json();
    return result.data;
  },

  // Funcion Delete
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'DELETE', 
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar el certificado');
    }
  }
};