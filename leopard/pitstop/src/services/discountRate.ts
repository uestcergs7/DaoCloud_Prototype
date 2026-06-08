import { api } from './api'
import type {
  DiscountRateRule,
  DiscountRateRuleListResponse,
  CreateDiscountRateRulePayload,
  UpdateDiscountRateRulePayload,
} from '@/types/discountRate'

const BASE = '/api/leopard/products/discount-rate-rules'

export const fetchDiscountRateRules = async (
  page: number = 1,
  pageSize: number = 10
): Promise<DiscountRateRuleListResponse> => {
  const { data } = await api.get(BASE, { params: { page, pageSize } })
  return data
}

export const createDiscountRateRule = async (
  payload: CreateDiscountRateRulePayload
): Promise<DiscountRateRule> => {
  const { data } = await api.post(BASE, payload)
  return data
}

export const updateDiscountRateRule = async (
  id: string,
  payload: UpdateDiscountRateRulePayload
): Promise<DiscountRateRule> => {
  const { data } = await api.put(`${BASE}/${id}`, payload)
  return data
}

export const deleteDiscountRateRule = async (id: string): Promise<void> => {
  await api.delete(`${BASE}/${id}`)
}

export const fetchChannelDomains = async (): Promise<string[]> => {
  const { data } = await api.get('/api/leopard/products/channel-domains')
  return data.items || []
}
