export interface IClientLoyalty {
  id: number
  clientId: number
  points: number
  level: string
  totalEarned: number
  totalSpent: number
}

export interface ILoyaltyTransaction {
  id: number
  clientId: number
  type: string
  points: number
  balance: number
  description?: string
  createdAt: string
}
