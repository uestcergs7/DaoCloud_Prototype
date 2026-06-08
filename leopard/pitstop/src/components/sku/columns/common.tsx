import type { ColumnType } from 'antd/es/table'
import { Tag, Button, Space, Tooltip } from 'antd'
import type { SKU, BillingType } from '@/types/sku'
import { BILLING_TYPE_LABELS } from '@/types/sku'

// 通用列：ID、区域、名称
export const baseColumns: ColumnType<SKU>[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 120,
  },
  {
    title: '区域',
    dataIndex: 'region',
    key: 'region',
    width: 100,
  },
  {
    title: '规格名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
]

// 价格列
export const priceColumn: ColumnType<SKU> = {
  title: '价格',
  dataIndex: 'price',
  key: 'price',
  width: 180,
  render: (price: number, record: SKU) => {
    const yuan = price / 1000000
    const discountHint = record.discountRuleId
      ? `折扣ID: ${record.discountRuleId}`
      : ''
    const discountTitle = record.discountTiers && record.discountTiers.length > 0
      ? record.discountTiers
        .map((item) => `${item.meteringAmounts} -> ${(item.discountPercentage / 100).toFixed(2)}%`)
        .join('\n')
      : '未查询到折扣阶梯信息'

    return (
      <div>
        <div>{`¥${yuan.toFixed(4)}`}</div>
        {discountHint ? (
          <Tooltip title={discountTitle}>
            <Tag color="gold">{record.discountRuleName ? `${record.discountRuleName} (${discountHint})` : discountHint}</Tag>
          </Tooltip>
        ) : null}
      </div>
    )
  },
}

export const discountColumn: ColumnType<SKU> = {
  title: '折扣',
  key: 'discount',
  width: 100,
  render: (_: unknown, record: SKU) => {
    if (!record.discountRuleId) {
      return <Tag>未关联</Tag>
    }
    const label = record.discountRuleName
      ? `${record.discountRuleName} (#${record.discountRuleId})`
      : `#${record.discountRuleId}`
    return (
      <Tooltip title={label}>
        <Tag color="success">已关联</Tag>
      </Tooltip>
    )
  },
}

// 计费类型列
export const billingTypeColumn: ColumnType<SKU> = {
  title: '计费类型',
  dataIndex: 'billingType',
  key: 'billingType',
  width: 100,
  render: (billingType: BillingType) => {
    const colorMap: Record<BillingType, string> = {
      PAY_AS_YOU_GO: 'blue',
      SUBSCRIPTION_DAILY: 'cyan',
      SUBSCRIPTION_WEEKLY: 'green',
      SUBSCRIPTION_MONTHLY: 'orange',
      SUBSCRIPTION_YEARLY: 'purple',
    }
    return (
      <Tag color={colorMap[billingType] || 'default'}>
        {BILLING_TYPE_LABELS[billingType] || billingType}
      </Tag>
    )
  },
}

// 状态列
export const statusColumn: ColumnType<SKU> = {
  title: '状态',
  key: 'status',
  width: 80,
  render: (_: unknown, record: SKU) => (
    <span style={{ color: record.status === 'available' ? '#52c41a' : '#ff4d4f' }}>
      {record.status === 'available' ? '上架' : '下架'}
    </span>
  ),
}

// 显示顺序列
export const displayOrderColumn: ColumnType<SKU> = {
  title: '顺序',
  dataIndex: 'displayOrder',
  key: 'displayOrder',
  width: 70,
  render: (order: number) => order ?? 0,
}

// 操作列生成器
export const createActionColumn = (
  onStatusChange: (id: string, status: string) => void
): ColumnType<SKU> => ({
  title: '操作',
  key: 'action',
  width: 100,
  render: (_: unknown, record: SKU) => (
    <Space size="small">
      <Button
        type={record.status === 'available' ? 'default' : 'primary'}
        size="small"
        onClick={() => onStatusChange(record.id, record.status)}
      >
        {record.status === 'available' ? '下架' : '上架'}
      </Button>
    </Space>
  ),
})
