import axios from 'axios'

// 1. 本地 1:1 复刻的默认 Mock 数据
const defaultRules = [
  {
    id: '1',
    name: '管理员免费规则',
    enabled: true,
    discountRate: '0.00',
    mainAccount: 'admin',
    skuId: 'sku-101',
    timePeriods: [{ start: 'now', end: 'forever' }],
  },
  {
    id: '2',
    name: '渠道专享七五折',
    enabled: true,
    discountRate: '0.75',
    mainAccount: 'DaoCloud_Partner',
    skuId: 'sku-102',
    timePeriods: [{ start: '2026-06-01T00:00:00Z', end: '2026-06-02T23:59:59Z', timeStart: '08:00:00', timeEnd: '18:00:00' }],
  },
  {
    id: '3',
    name: '大客户专属折扣',
    enabled: true,
    discountRate: '0.85',
    mainAccount: 'SubAccount_ShenN',
    skuId: 'sku-102',
    timePeriods: [{ start: 'now', end: 'forever' }],
  },
  {
    id: '4',
    name: '六月限时促销',
    enabled: true,
    discountRate: '0.60',
    mainAccount: 'DaoCloud_Partner',
    skuId: 'sku-101',
    timePeriods: [{ start: '2026-06-01T00:00:00Z', end: '2026-06-30T23:59:59Z' }],
  },
  {
    id: '5',
    name: '待启用草稿规则',
    enabled: false,
    discountRate: '0.90',
    mainAccount: 'admin',
    skuId: 'sku-102',
    timePeriods: [{ start: 'now', end: 'forever' }],
  },
  {
    id: '6',
    name: '每日高峰期九折',
    enabled: true,
    discountRate: '0.90',
    mainAccount: 'SubAccount_ShenN',
    skuId: 'sku-101',
    timePeriods: [{ start: 'now', end: 'forever', timeStart: '09:00:00', timeEnd: '18:00:00' }],
  },
]

const mockUsers = [
  { username: 'admin' },
  { username: 'DaoCloud_Partner' },
  { username: 'SubAccount_ShenN' },
  { username: 'DCE_Operator' },
  { username: 'Financial_Auditor' }
]

const mockSkus = [
  { id: 'sku-101' },
  { id: 'sku-102' },
  { id: 'sku-103' },
  { id: 'sku-104' },
  { id: 'sku-105' },
  { id: 'sku-106' },
  { id: 'sku-107' }
]

const mockChannelDomains = [
  'partner.d.run',
  'enterprise.d.run',
  'edu.d.run',
]

// 2. LocalStorage 持久化助手函数
const getStoredRules = () => {
  const data = localStorage.getItem('mock_discount_rules')
  if (!data) {
    localStorage.setItem('mock_discount_rules', JSON.stringify(defaultRules))
    localStorage.setItem('mock_discount_rules_increment', '7')
    return defaultRules
  }
  return JSON.parse(data)
}

const saveStoredRules = (rules: any[]) => {
  localStorage.setItem('mock_discount_rules', JSON.stringify(rules))
}

const getNextId = () => {
  const idStr = localStorage.getItem('mock_discount_rules_increment') || '7'
  const nextId = parseInt(idStr, 10)
  localStorage.setItem('mock_discount_rules_increment', String(nextId + 1))
  return String(nextId)
}

// 3. 创建 axios 实例 (在 Cloudflare 静态托管上通过本地适配器拦截网络请求)
export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// 自动检测是否处于 Cloudflare Pages 等无后端的生产静态预览模式
// Cloudflare Pages 的域名通常包含 pages.dev，且非 localhost（本地开发时可以连接本地 Express 服务）
const isStaticMockMode = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('pages.dev') ||
  window.location.search.includes('mock=true')
)

if (isStaticMockMode) {
  api.interceptors.request.use(async (config) => {
    const url = config.url || ''
    const method = (config.method || 'get').toLowerCase()

    // A. 拦截折扣率列表获取 (GET /api/leopard/products/discount-rate-rules)
    if (url.includes('/products/discount-rate-rules') && method === 'get') {
      const rules = getStoredRules()
      return {
        ...config,
        adapter: async () => ({
          data: {
            items: rules,
            pagination: { page: 1, pageSize: 100, total: rules.length },
            nextId: localStorage.getItem('mock_discount_rules_increment') || '7'
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      }
    }

    // B. 拦截折扣率新建 (POST /api/leopard/products/discount-rate-rules)
    if (url.includes('/products/discount-rate-rules') && method === 'post') {
      const rules = getStoredRules()
      const newRule = {
        ...config.data,
        id: getNextId()
      }
      rules.push(newRule)
      saveStoredRules(rules)
      return {
        ...config,
        adapter: async () => ({
          data: newRule,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      }
    }

    // C. 拦截折扣率修改 (PUT /api/leopard/products/discount-rate-rules/:id)
    if (url.includes('/products/discount-rate-rules/') && method === 'put') {
      const id = url.split('/').pop() || ''
      const rules = getStoredRules()
      const idx = rules.findIndex((r: any) => r.id === id)
      if (idx !== -1) {
        rules[idx] = { ...rules[idx], ...config.data }
        saveStoredRules(rules)
        return {
          ...config,
          adapter: async () => ({
            data: rules[idx],
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          }),
        }
      }
    }

    // D. 拦截折扣率删除 (DELETE /api/leopard/products/discount-rate-rules/:id)
    if (url.includes('/products/discount-rate-rules/') && method === 'delete') {
      const id = url.split('/').pop() || ''
      const rules = getStoredRules()
      const filtered = rules.filter((r: any) => r.id !== id)
      saveStoredRules(filtered)
      return {
        ...config,
        adapter: async () => ({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      }
    }

    // E. 拦截渠道域名列表 (GET /api/leopard/products/channel-domains)
    if (url.includes('/products/channel-domains') && method === 'get') {
      return {
        ...config,
        adapter: async () => ({
          data: {
            items: mockChannelDomains,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      }
    }

    // F. 拦截 Ghippo 用户列表 (GET /api/ghippo/users)
    if (url.includes('/ghippo/users') && method === 'get') {
      return {
        ...config,
        adapter: async () => ({
          data: {
            items: mockUsers,
            pagination: { page: 1, pageSize: 100, total: mockUsers.length }
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      }
    }

    // G. 拦截 Leopard SKU 列表 (POST /api/leopard/products/skus)
    if (url.includes('/products/skus') && method === 'post') {
      return {
        ...config,
        adapter: async () => ({
          data: {
            items: mockSkus,
            pagination: { page: 1, pageSize: 100, total: mockSkus.length }
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      }
    }

    return config
  })
}

// 响应拦截器：统一错误处理 (非 Mock 状态下生效)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
