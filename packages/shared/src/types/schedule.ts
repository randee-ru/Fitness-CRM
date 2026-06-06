export interface IClass {
  id: number
  title: string
  description?: string
  room?: string
  maxCapacity: number
  startTime: string
  endTime: string
  status: string
  trainer?: { id: number; firstName: string; lastName: string; photoUrl?: string }
  classType: { id: number; name: string; color: string }
  registrationsCount: number
}

export interface ITrainer {
  id: number
  firstName: string
  lastName: string
  photoUrl?: string
  bio?: string
  specialties?: string[]
  isActive: boolean
}
