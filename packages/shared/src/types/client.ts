export interface IClient {
  id: number
  firstName: string
  lastName: string
  middleName?: string
  email?: string
  phone: string
  photoUrl?: string
  birthDate?: string
  gender?: string
  balance: number
  isActive: boolean
  registrationDate: string
  createdAt: string
  updatedAt: string
}

export interface IClientListItem {
  id: number
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  email?: string
  photoUrl?: string
  isActive: boolean
  balance: number
  activeMembership?: {
    id: number
    name: string
    expirationDate?: string
    status: string
  }
}

export interface IPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface IPaginatedResponse<T> {
  data: T[]
  pagination: IPagination
}
