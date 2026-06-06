import { DealStatus } from './enums'

export interface IPipeline {
  id: number
  name: string
  description?: string
  isDefault: boolean
  stages: IPipelineStage[]
}

export interface IPipelineStage {
  id: number
  pipelineId: number
  name: string
  color: string
  sortOrder: number
  isWon: boolean
  isLost: boolean
  deals?: IDeal[]
}

export interface IDeal {
  id: number
  pipelineId: number
  stageId: number
  clientId?: number
  title: string
  description?: string
  amount?: number
  status: DealStatus
  assignedToId?: number
  dueDate?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  client?: { id: number; firstName: string; lastName: string; phone: string }
  assignedTo?: { id: number; firstName: string; lastName: string }
}
