import type { ColumnType } from 'antd/es/table'
import type { SKU } from '@/types/sku'
import { baseColumns, priceColumn, billingTypeColumn, statusColumn, discountColumn } from './common'

// 默认列配置（用于暂不支持的产品）
export const defaultColumns: ColumnType<SKU>[] = [
  ...baseColumns,
  priceColumn,
  billingTypeColumn,
  discountColumn,
  statusColumn,
]
