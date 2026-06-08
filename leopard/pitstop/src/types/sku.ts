// SKU 相关类型定义

// 计费类型枚举（与 Leopard API 保持一致）
export type BillingType =
  | 'PAY_AS_YOU_GO'
  | 'SUBSCRIPTION_DAILY'
  | 'SUBSCRIPTION_WEEKLY'
  | 'SUBSCRIPTION_MONTHLY'
  | 'SUBSCRIPTION_YEARLY'

// 计费类型显示名映射
export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  PAY_AS_YOU_GO: '按量付费',
  SUBSCRIPTION_DAILY: '包日',
  SUBSCRIPTION_WEEKLY: '包周',
  SUBSCRIPTION_MONTHLY: '包月',
  SUBSCRIPTION_YEARLY: '包年',
}

// 计费类型选项（当前开放：按量付费、包月、包年）
export const BILLING_TYPE_OPTIONS: { value: BillingType; label: string }[] = [
  { value: 'PAY_AS_YOU_GO', label: '按量付费' },
  { value: 'SUBSCRIPTION_MONTHLY', label: '包月' },
  { value: 'SUBSCRIPTION_YEARLY', label: '包年' },
]

// billingType → 价格标签映射
export const BILLING_TYPE_PRICE_LABELS: Record<BillingType, string> = {
  PAY_AS_YOU_GO: '元/小时',
  SUBSCRIPTION_DAILY: '元/天',
  SUBSCRIPTION_WEEKLY: '元/周',
  SUBSCRIPTION_MONTHLY: '元/月',
  SUBSCRIPTION_YEARLY: '元/年',
}

export interface SKU {
  id: string
  region: string        // 区域
  name: string          // 规格名称
  price: number         // 价格
  billingType: BillingType  // 计费类型
  discountRuleId?: string
  discountRuleName?: string
  discountTiers?: DiscountTier[]
  gpuModel: string      // GPU型号
  gpuType: string       // GPU类型
  gpuCount: string      // GPU数量
  gpuMemory: string     // GPU内存
  vgpuPower: string     // vGPU算力
  vgpuMemory: string    // vGPU内存
  cpu: string           // CPU
  memory: string        // 内存
  status: string        // 状态（上架/下架）
  displayOrder: number  // 显示顺序
  modelName: string     // MaaS: 模型名称（spec field: model-name）
  tokenType: string     // MaaS: Token 类型（spec field: token-type, input/output）
}

export interface Product {
  id: string
  name: string
}

export interface Region {
  regionId: string
  regionName: string
  cluster?: string
  regionType?: string
  schemes?: string
  host?: string
}

export interface PaginationParams {
  current: number
  pageSize: number
  total: number
}

export interface SKUListResponse {
  data: SKU[]
  pagination: PaginationParams
}

// 添加 SKU 表单数据
export interface AddSKUFormData {
  product: string
  specId?: number        // 选择已有规格时使用
  name: string           // 新建规格时的名称
  region: string
  price: number
  billingType: BillingType
  discountRuleId?: string
  gpuModel: string
  gpuVendor: string      // GPU 厂商（如 Nvidia, Metax-GPU）
  cpuVendor: string      // CPU 厂商（如 Intel, AMD）
  gpuType: 'gpu' | 'vgpu'
  gpuCount?: number
  gpuMemory?: number
  vgpuCount?: number     // vGPU 数量
  vgpuPower?: number
  vgpuMemory?: number
  cpu: number
  memory: number
  computingUnit?: number  // 算力单元
  systemDisk: number
  displayOrder?: number
}

// 规格信息（来自 /products/spec-infos）
export interface SpecInfo {
  id: number
  name: string
  product: string
  items: { key: string; value: string }[]
}

export interface DiscountTier {
  meteringAmounts: number
  discountPercentage: number
}

export interface DiscountRuleInfo {
  id: string
  name: string
  meteringAmountsDiscounts: DiscountTier[]
}
