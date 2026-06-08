import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  description?: string
  firstname?: string
  lastname?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface UserListResponse {
  items: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export interface UserListParams {
  search?: string
  page?: number
  pageSize?: number
}

// Ghippo API Base URL
const GHIPPO_API_BASE = '/api/ghippo'

export const fetchUsers = async (params: UserListParams = {}): Promise<UserListResponse> => {
  const { page = 1, pageSize = 10, search } = params

  // Clean params
  const queryParams: Record<string, any> = {
    page,
    pageSize,
  }
  if (search) queryParams.search = search

  const response = await api.get(`${GHIPPO_API_BASE}/users`, {
    params: queryParams,
    baseURL: '', // Override default baseURL (which is /api/leopard)
  })

  return response.data
}

export const fetchUserDetail = async (userId: string): Promise<User> => {
  const response = await api.get(`${GHIPPO_API_BASE}/users/${userId}`, {
    baseURL: '', // Override default baseURL
  })
  return response.data
}

// === 实名认证 ===

export type CertifySubject = 'Individual' | 'Enterprise' | 'College'

export interface UserCertifyInfo {
  certName: string
  certNo: string
  certTime: string
  subject: CertifySubject
}

export interface UpdateCertifyPayload {
  userId: string
  certName: string
  certNo: string
  subject: CertifySubject
}

// GET 走 /proxy（用户 token）
export const fetchUserCertifyInfo = async (userId: string): Promise<UserCertifyInfo> => {
  const response = await api.get(`/proxy/users/${userId}/certify`, {
    baseURL: '',
  })
  return response.data
}

// PUT 走 /api/ghippo（admin token）
export const updateUserCertify = async (payload: UpdateCertifyPayload): Promise<void> => {
  await api.put(`${GHIPPO_API_BASE}/users/certify`, payload, {
    baseURL: '',
  })
}
