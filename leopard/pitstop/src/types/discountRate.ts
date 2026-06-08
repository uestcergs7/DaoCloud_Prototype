// 折扣率规则类型定义

export interface TimePeriodItem {
  start: string            // 日期时间字符串 或 "now"
  end: string              // 日期时间字符串 或 "forever"
  timeStart?: string       // "HH:mm:ss"
  timeEnd?: string         // "HH:mm:ss"
}

export interface DiscountRateRule {
  id: string                // 纯数字ID, 如 "1", "2"
  name: string              // 折扣规则名称
  enabled: boolean          // 启用/停用
  discountRate: string      // "0.75", "0.80"
  mainAccount: string       // 主账号用户名
  skuId: string             // 绑定的 SKU ID
  timePeriods: TimePeriodItem[]
}

export interface DiscountRateRuleListResponse {
  items: DiscountRateRule[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  nextId?: string
}

export interface CreateDiscountRateRulePayload {
  name: string
  enabled: boolean
  discountRate: string
  mainAccount?: string
  skuId?: string
  timePeriods?: TimePeriodItem[]
}

export interface UpdateDiscountRateRulePayload extends Partial<CreateDiscountRateRulePayload> {
  id?: string
}
