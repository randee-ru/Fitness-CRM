import { PaymentMethod, PaymentStatus } from './enums'

export interface IPayment {
  id: number
  clientId?: number
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  description?: string
  paidAt: string
  client?: { id: number; firstName: string; lastName: string }
}

export interface ICashOperation {
  id: number
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  date: string
}
