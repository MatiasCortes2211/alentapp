import { PaymentDTO } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida". El dominio dice: 
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".

export interface PaymentRepository {
  create(payment: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO>;
  findById(id: string): Promise<PaymentDTO | null>;
  findActiveByMemberMonthYear(memberId: string, month: number, year: number): Promise<PaymentDTO | null>;
  findAll(): Promise<PaymentDTO[]>;
}