import type { MedicalCertificateDTO, CreateMedicalCertificate } from '@alentapp/shared';

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
      // Si el backend tira un 400 por fecha vencida, acá lo capturamos
      throw new Error(errorData.error || 'Error al registrar el certificado');
    }

    const result = await response.json();
    return result.data;
  },
};