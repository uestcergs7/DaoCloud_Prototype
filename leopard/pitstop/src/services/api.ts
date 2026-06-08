import axios from 'axios'
import type {
  SKU,
  SKUListResponse,
  Product,
  Region,
  AddSKUFormData,
  BillingType,
  SpecInfo,
  DiscountRuleInfo,
  DiscountTier,
} from '@/types/sku'

// billingType → billingPolicyId 映射（后端预定义）
export const BILLING_POLICY_ID_MAP: Record<string, number> = {
  PAY_AS_YOU_GO: 1,
  SUBSCRIPTION_DAILY: 2,
  SUBSCRIPTION_WEEKLY: 3,
  SUBSCRIPTION_MONTHLY: 8,
  SUBSCRIPTION_YEARLY: 9,
}

// 存储类产品固定使用按用量计费策略
export const STORAGE_BILLING_POLICY_ID = 4

// 运行时配置（Docker环境）优先于构建时环境变量（本地开发）
const API_BASE_URL = '/api/leopard'

// 创建 axios 实例
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 携带 session cookie
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

const normalizeDiscountTiers = (tiers: unknown): DiscountTier[] => {
  if (!Array.isArray(tiers)) {
    return []
  }
  return tiers
    .map((tier) => {
      if (!tier || typeof tier !== 'object') {
        return null
      }
      const item = tier as { meteringAmounts?: number | string; discountPercentage?: number | string }
      const meteringAmounts = Number(item.meteringAmounts)
      const discountPercentage = Number(item.discountPercentage)
      if (Number.isNaN(meteringAmounts) || Number.isNaN(discountPercentage)) {
        return null
      }
      return { meteringAmounts, discountPercentage }
    })
    .filter((tier): tier is DiscountTier => tier !== null)
}

export const getDiscountRule = async (id: string): Promise<DiscountRuleInfo> => {
  const response = await api.get(`/products/discounts/${id}`)
  const data = response.data || {}
  return {
    id: String(data.id ?? id),
    name: data.name || '',
    meteringAmountsDiscounts: normalizeDiscountTiers(data.meteringAmountsDiscounts),
  }
}

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return ''
}

// Leopard SKU Item (EAV) → Frontend SKU (Flat) 转换
const mapLeopardSkuToFrontend = (item: Record<string, unknown>): SKU => {
  const fields: unknown[] = Array.isArray(item.specFields) ? item.specFields : []
  const fieldMap = new Map(
    fields.map((field) => {
      if (!field || typeof field !== 'object') {
        return ['', '']
      }
      const typedField = field as { key?: unknown; value?: unknown }
      return [toStringValue(typedField.key), toStringValue(typedField.value)]
    })
  )

  return {
    id: toStringValue(item.id),
    region: toStringValue(item.region),
    name: toStringValue(item.specName),
    price: parseInt(toStringValue(item.price) || '0', 10),
    billingType: (toStringValue(item.billingType) || 'PAY_AS_YOU_GO') as BillingType,
    discountRuleId: toStringValue(item.discountRuleId),
    gpuModel: (fieldMap.get('gpu-model') || fieldMap.get('GPU Model') || '') as string,
    gpuType: (fieldMap.get('gpu-type') || '') as string,
    gpuCount: (fieldMap.get('gpu-count') || '') as string,
    gpuMemory: (fieldMap.get('gpu-memory') || '') as string,
    vgpuPower: (fieldMap.get('vgpu-power') || '') as string,
    vgpuMemory: (fieldMap.get('vgpu-memory') || '') as string,
    cpu: (fieldMap.get('cpu') || '') as string,
    memory: (fieldMap.get('memory') || '') as string,
    status: 'unavailable', // 会被 fetchSKUs 用 available 字段覆盖
    displayOrder: 0, // 会被 fetchSKUs 覆盖
    modelName: (fieldMap.get('model-name') || '') as string,
    tokenType: (fieldMap.get('token-type') || '') as string,
  }
}

// 获取 SKU 列表
export const fetchSKUs = async (
  page: number = 1,
  pageSize: number = 10,
  region?: string,
  product?: string
): Promise<SKUListResponse> => {
  if (!product) {
    return {
      data: [],
      pagination: { current: page, pageSize, total: 0 },
    }
  }

  const response = await api.post('/products/skus', {
    page,
    pageSize,
    product,
    regionId: region,
  })

  const items = response.data.items || []
  const skus = items.map(mapLeopardSkuToFrontend)

  // 临时方案：为每个 SKU 获取 available 和 displayOrder 字段
  const skuInfoPromises = skus.map(async (sku: SKU) => {
    try {
      const info = await api.get(`/products/sku-infos/${sku.id}`)
      return {
        id: sku.id,
        available: info.data.available,
        displayOrder: info.data.displayOrder || 0,
        discountRuleId: info.data.discountRuleId || sku.discountRuleId || '',
      }
    } catch {
      return { id: sku.id, available: 0, displayOrder: 0, discountRuleId: sku.discountRuleId || '' }
    }
  })
  const skuInfos = await Promise.all(skuInfoPromises)
  const infoMap = new Map(skuInfos.map(info => [info.id, info]))

  const discountRuleIds = [...new Set(
    skuInfos.map(info => info.discountRuleId).filter((id): id is string => Boolean(id))
  )]

  const discountRules = await Promise.all(
    discountRuleIds.map(async (id) => {
      try {
        const rule = await getDiscountRule(id)
        return [id, rule] as const
      } catch {
        return [id, null] as const
      }
    })
  )
  const discountRuleMap = new Map<string, DiscountRuleInfo>(
    discountRules
      .filter((entry): entry is readonly [string, DiscountRuleInfo] => entry[1] !== null)
      .map(([id, rule]) => [id, rule])
  )

  // 合并 available 和 displayOrder
  const skusWithStatus = skus.map((sku: SKU) => {
    const info = infoMap.get(sku.id)
    const discountRuleId = info?.discountRuleId || sku.discountRuleId || ''
    const discountRule = discountRuleId ? discountRuleMap.get(discountRuleId) : undefined
    return {
      ...sku,
      status: info?.available === 1 ? 'available' : 'unavailable' as const,
      displayOrder: info?.displayOrder ?? 0,
      discountRuleId: discountRuleId || undefined,
      discountRuleName: discountRule?.name,
      discountTiers: discountRule?.meteringAmountsDiscounts,
    }
  })

  return {
    data: skusWithStatus,
    pagination: {
      current: response.data.pagination?.page || page,
      pageSize: response.data.pagination?.pageSize || pageSize,
      total: response.data.pagination?.total || 0,
    },
  }
}

// 获取产品列表
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products/spec-field-keys')
  const items = Array.isArray(response.data.items) ? response.data.items as Array<{ product?: unknown }> : []
  return items.map((item) => ({
    id: toStringValue(item.product),
    name: toStringValue(item.product),
  }))
}

// 获取区域列表
export const fetchRegions = async (): Promise<Region[]> => {
  const response = await api.get('/products/regions')
  return response.data.items || []
}

// 获取单个 SKU
export const fetchSKUById = async (id: string): Promise<SKU> => {
  const response = await api.get(`/products/skus/${id}`)
  return mapLeopardSkuToFrontend(response.data as Record<string, unknown>)
}

// 更新 SKU 上下架状态（需先获取 specId）
export const updateSKUStatus = async (
  id: string,
  status: string,
  productName: string,
  billingType: BillingType
): Promise<void> => {
  // 先获取 SKU 详情以取得 specId
  const skuInfo = await api.get(`/products/sku-infos/${id}`)
  const { specId, regionName } = skuInfo.data

  await api.put(`/products/sku-infos/${id}`, {
    specId,
    productName,
    regionName,
    billingPolicyId: BILLING_POLICY_ID_MAP[billingType] || 1,
    available: status === 'available' ? 1 : 0,
    discountRuleId: skuInfo.data.discountRuleId,
  })
}

// SKU 详情（包含 sku-infos 和 skus 的完整信息）
export interface SKUDetail {
  id: string
  specId: number
  productName: string
  regionName: string
  price: number
  billingPolicyId: number
  freeQuantity: number
  available: number
  displayOrder: number
  description: string
  discountRuleId?: string
  // 前端展示字段（从 skus 接口获取）
  specName: string
  billingType: BillingType
  gpuModel: string
  gpuType: string
  gpuCount: string
  gpuMemory: string
  vgpuPower: string
  vgpuMemory: string
  cpu: string
  memory: string
  // MaaS 字段
  modelName: string
  tokenType: string
}

// billingPolicyId → billingType 反向映射
const BILLING_POLICY_ID_TO_TYPE: Record<number, BillingType> = {
  1: 'PAY_AS_YOU_GO',
  2: 'SUBSCRIPTION_DAILY',
  3: 'SUBSCRIPTION_WEEKLY',
  8: 'SUBSCRIPTION_MONTHLY',
  9: 'SUBSCRIPTION_YEARLY',
}

// 获取 SKU 完整详情（用于编辑）
export const fetchSKUDetail = async (id: string): Promise<SKUDetail> => {
  // 并行获取 sku-infos 和 skus
  const [infoRes, skuRes] = await Promise.all([
    api.get(`/products/sku-infos/${id}`),
    api.get(`/products/skus/${id}`),
  ])

  const info = infoRes.data
  const sku = skuRes.data
  const fields: unknown[] = Array.isArray(sku.specFields) ? sku.specFields : []
  const fieldMap = new Map(
    fields.map((field) => {
      if (!field || typeof field !== 'object') {
        return ['', '']
      }
      const typedField = field as { key?: unknown; value?: unknown }
      return [toStringValue(typedField.key), toStringValue(typedField.value)]
    })
  )

  return {
    id: info.id,
    specId: info.specId,
    productName: info.productName,
    regionName: info.regionName,
    price: parseInt(info.price || '0', 10),
    billingPolicyId: info.billingPolicyId,
    freeQuantity: info.freeQuantity || 0,
    available: info.available,
    displayOrder: info.displayOrder || 0,
    description: info.description || '',
    discountRuleId: info.discountRuleId || '',
    specName: sku.specName || '',
    billingType: BILLING_POLICY_ID_TO_TYPE[info.billingPolicyId] || 'PAY_AS_YOU_GO',
    gpuModel: (fieldMap.get('gpu-model') || fieldMap.get('GPU Model') || '') as string,
    gpuType: (fieldMap.get('gpu-type') || '') as string,
    gpuCount: (fieldMap.get('gpu-count') || '') as string,
    gpuMemory: (fieldMap.get('gpu-memory') || '') as string,
    vgpuPower: (fieldMap.get('vgpu-power') || '') as string,
    vgpuMemory: (fieldMap.get('vgpu-memory') || '') as string,
    cpu: (fieldMap.get('cpu') || '') as string,
    memory: (fieldMap.get('memory') || '') as string,
    modelName: (fieldMap.get('model-name') || '') as string,
    tokenType: (fieldMap.get('token-type') || '') as string,
  }
}

// 更新 SKU（用于编辑页面）
export const updateSKU = async (
  id: string,
  data: {
    price?: number
    billingPolicyId?: number
    freeQuantity?: number
    displayOrder?: number
    description?: string
    discountRuleId?: string
  }
): Promise<void> => {
  // 先获取原始 SKU 信息
  const skuInfo = await api.get(`/products/sku-infos/${id}`)
  const { specId, productName, regionName, available } = skuInfo.data

  await api.put(`/products/sku-infos/${id}`, {
    specId,
    productName,
    regionName,
    available,
    billingPolicyId: data.billingPolicyId ?? skuInfo.data.billingPolicyId,
    price: data.price !== undefined ? String(data.price) : skuInfo.data.price,
    freeQuantity: data.freeQuantity ?? skuInfo.data.freeQuantity,
    displayOrder: data.displayOrder ?? skuInfo.data.displayOrder,
    description: data.description ?? skuInfo.data.description,
    discountRuleId: data.discountRuleId ?? skuInfo.data.discountRuleId,
  })
}

// 获取规格列表
export const fetchSpecs = async (product: string): Promise<SpecInfo[]> => {
  const response = await api.get('/products/spec-infos', {
    params: { product, pageSize: 100 },
  })
  return response.data.items || []
}

// 创建规格
export const createSpec = async (data: {
  product: string
  name: string
  items: { key: string; value: string }[]
}): Promise<number> => {
  const response = await api.post('/products/spec-infos', data)
  return response.data.id
}

// 创建 SKU（优先使用 specId，无则先创建 spec）
export const createSKU = async (data: AddSKUFormData): Promise<unknown> => {
  let specId = data.specId

  // 无 specId，需先创建规格
  if (!specId) {
    const specItems: { key: string; value: string }[] = [
      { key: 'gpu-model', value: data.gpuModel },
      { key: 'gpu-vendor', value: data.gpuVendor || 'Nvidia' },
      { key: 'gpu-type', value: data.gpuType },
      { key: 'cpu-count', value: String(data.cpu) },
      { key: 'cpu-vendor', value: data.cpuVendor || 'Intel' },
      { key: 'memory', value: String(Math.round(data.memory * 1024)) },
    ]

    if (data.systemDisk) {
      specItems.push({ key: 'system-disk', value: String(Math.round(data.systemDisk * 1024)) })
    }

    if (data.gpuType === 'gpu') {
      specItems.push({ key: 'gpu-count', value: String(data.gpuCount || 1) })
      specItems.push({ key: 'gpu-memory', value: String(Math.round((data.gpuMemory || 0) * 1024)) })
    } else {
      specItems.push({ key: 'vgpu-core', value: String(data.vgpuPower || 0) })
      specItems.push({ key: 'vgpu-count', value: String(data.vgpuCount || 1) })
      specItems.push({ key: 'vgpu-memory', value: String(Math.round((data.vgpuMemory || 0) * 1024)) })
    }

    if (data.computingUnit != null) {
      specItems.push({ key: 'computing-unit', value: String(data.computingUnit) })
    }

    specId = await createSpec({
      product: data.product,
      name: data.name,
      items: specItems,
    })
  }

  // 创建 SKU
  const price = Math.round(data.price * 1000000)
  const billingPolicyId = BILLING_POLICY_ID_MAP[data.billingType] || 1
  return await api.post('/products/sku-infos', {
    specId,
    productName: data.product,
    regionName: data.region,
    price: String(price),
    billingPolicyId,
    available: 0,
    displayOrder: data.displayOrder ?? 0,
    discountRuleId: data.discountRuleId?.trim() || undefined,
  })
}

// 获取 GPU 型号列表
export const fetchGPUModels = async (regionId: string, product: string = 'zestu-container-instance'): Promise<string[]> => {
  const response = await api.get('/products/specs', {
    params: {
      regionId,
      specKey: 'gpu-model',
      product,
    },
  })
  const specFields = response.data.specFields || []
  // 提取不重复的 value 值
  const models = [...new Set(specFields.map((f: { value: string }) => f.value))]
  return models as string[]
}

// 创建存储类 SKU（文件存储 / 本地盘）
export const createStorageSKU = async (
  productName: string,
  regionName: string,
  options: { price?: number; freeQuantity?: number } = {}
): Promise<unknown> => {
  const specs = await fetchSpecs(productName)
  if (specs.length === 0) {
    throw new Error(`未找到 ${productName} 规格，请先创建规格`)
  }
  const specId = specs[0].id

  const billingPolicyId = STORAGE_BILLING_POLICY_ID
  const price = options.price ?? 9600
  const freeQuantity = options.freeQuantity ?? 0

  return await api.post('/products/sku-infos', {
    specId,
    productName,
    regionName,
    price: String(price),
    billingPolicyId,
    freeQuantity,
    available: 0,
  })
}

// 向后兼容别名
export const createFileStorageSKU = (
  regionName: string,
  options: { price?: number; freeQuantity?: number } = {}
) => createStorageSKU('zestu-file-storage', regionName, { freeQuantity: 20, ...options })

export const createLocalStorageSKU = (
  regionName: string,
  options: { price?: number; freeQuantity?: number } = {}
) => createStorageSKU('zestu-local-storage', regionName, options)

// MaaS 计费策略 ID
export const MAAS_BILLING_POLICY_MAP: Record<string, number> = {
  'k-token': 3,
  'picture': 5,
}

// 创建 MaaS SKU（先创建 spec，再创建 SKU）
export const createMaaSSKU = async (data: {
  modelName: string
  tokenType: 'input' | 'output'
  billingUnit: 'k-token' | 'picture'
  price: number       // 微元，直接传入
  description?: string
}): Promise<unknown> => {
  const specName = `${data.modelName} ${data.tokenType === 'input' ? 'Input' : 'Output'}`

  const specId = await createSpec({
    product: 'hydra-maas',
    name: specName,
    items: [
      { key: 'model-name', value: data.modelName },
      { key: 'token-type', value: data.tokenType },
    ],
  })

  const billingPolicyId = MAAS_BILLING_POLICY_MAP[data.billingUnit] || 3

  return await api.post('/products/sku-infos', {
    specId,
    productName: 'hydra-maas',
    regionName: '',
    price: String(data.price),
    billingPolicyId,
    description: data.description || specName,
    available: 0,
    displayOrder: 0,
  })
}
