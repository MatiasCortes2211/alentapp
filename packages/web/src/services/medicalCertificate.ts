import type { MedicalCertificateDTO, CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared'; // 👈 Sumamos el tipo de Update acá

// Usamos la misma URL base que el de miembros
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const medicalCertificateService = {
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
      
      // Capturamos 'message' (para las fechas/Zod) o 'error' (para socio inexistente)
      const errorMessage = errorData.message || errorData.error || 'Error al registrar el certificado';
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  }, 

  async getByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/medical-certificates/member/${memberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || errorData.error || 'Error al obtener los certificados';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  },

  // =========================================================================
  // 🚀 NUEVO MÉTODO PARA EL UPDATE (PATCH):
  // =========================================================================
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
      const errorMessage = errorData.error || errorData.message || 'Error al actualizar el certificado';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  },
};