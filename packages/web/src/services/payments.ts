import type { PaymentDTO, CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const paymentsService = {

  async create(data: CreatePaymentRequest): Promise<PaymentDTO> {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el pago'); 
    }
    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<PaymentDTO[]> {
    const response = await fetch(`${API_URL}/payments`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener los pagos');
    }
    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> { 
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el pago');
    }
    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el pago');
    }
  },
};