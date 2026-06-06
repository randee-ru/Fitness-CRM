import { AccessEventType } from './enums'

export interface IRfidKey {
  id: number
  clientId: number
  code: string
  type: 'card' | 'bracelet' | 'keyfob'
  label?: string
  isActive: boolean
  issuedAt: string
}

export interface IAccessEvent {
  id: number
  rfidKeyId?: number
  type: AccessEventType
  zone: string
  deviceId?: string
  granted: boolean
  reason?: string
  timestamp: string
}
