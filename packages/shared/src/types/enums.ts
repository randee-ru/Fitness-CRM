export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEPTION = 'RECEPTION',
  TRAINER = 'TRAINER',
  DIRECTOR = 'DIRECTOR',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FROZEN = 'FROZEN',
  CANCELLED = 'CANCELLED',
}

export enum VisitStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  OVERSTAY = 'OVERSTAY',
}

export enum DealStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
  ARCHIVED = 'ARCHIVED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  TRANSFER = 'TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum AccessEventType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  DENIED = 'DENIED',
}

export enum LoyaltyTransactionType {
  EARN = 'EARN',
  SPEND = 'SPEND',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
}

export enum CallDirection {
  IN = 'IN',
  OUT = 'OUT',
}
