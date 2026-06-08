import type { ColumnType } from 'antd/es/table'
import type { SKU } from '@/types/sku'
import { baseColumns, priceColumn, statusColumn, displayOrderColumn, discountColumn } from './common'

// 文件存储专用列
const freeQuantityColumn: ColumnType<SKU> = {
  title: '免费额度',
  dataIndex: 'freeQuantity',
  key: 'freeQuantity',
  width: 100,
  render: (qty: number) => qty ? `${qty} GB` : '-',
}

// 文件存储完整列配置（不含操作列）
export const fileStorageColumns: ColumnType<SKU>[] = [
  ...baseColumns,
  {
    ...priceColumn,
    title: '价格 (元/GB/小时)',
    render: (price: number, record: SKU) => {
      const yuan = price / 1000000
      if (!record.discountRuleId) {
        return `¥${yuan.toFixed(4)}`
      }
      return `${`¥${yuan.toFixed(4)}`} (折扣ID:${record.discountRuleId})`
    },
  },
  discountColumn,
  freeQuantityColumn,
  displayOrderColumn,
  statusColumn,
]
