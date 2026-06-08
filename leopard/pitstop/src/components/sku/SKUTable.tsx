import { Table, Button, Space, Tooltip, Dropdown, Modal } from 'antd'
import { DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { TablePaginationConfig, ColumnType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import type { SKU, PaginationParams } from '@/types/sku'
import { getProductConfig } from '@/config/productConfig'

interface SKUTableProps {
  skus: SKU[]
  loading: boolean
  pagination: PaginationParams
  product: string  // 产品ID
  onPaginationChange: (page: number, pageSize: number) => void
  onStatusChange: (id: string, currentStatus: string) => void
}

export default function SKUTable({
  skus,
  loading,
  pagination,
  product,
  onPaginationChange,
  onStatusChange,
}: SKUTableProps) {
  const navigate = useNavigate()

  // 根据产品获取列配置
  const productConfig = getProductConfig(product)

  // 编辑按钮点击
  const handleEdit = (skuId: string) => {
    if (productConfig.editRoute) {
      navigate(`${productConfig.editRoute}/${skuId}`)
    }
  }

  // 复制按钮点击（仅容器实例）
  const handleCopy = (skuId: string) => {
    navigate(`/sku/add/container?copy=${skuId}`)
  }

  // 上下架确认
  const handleStatusChangeConfirm = (record: SKU) => {
    const isOnline = record.status === 'available'
    const action = isOnline ? '下架' : '上架'

    Modal.confirm({
      title: `确认${action}`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要{action}以下 SKU 吗？</p>
          <p style={{ color: '#666', fontSize: 12 }}>
            ID: {record.id}<br />
            名称: {record.name}
          </p>
          {isOnline && (
            <p style={{ color: '#ff4d4f', marginTop: 8 }}>
              ⚠️ 下架后用户将无法购买此 SKU
            </p>
          )}
        </div>
      ),
      okText: action,
      okButtonProps: isOnline ? { danger: true } : {},
      cancelText: '取消',
      onOk: () => onStatusChange(record.id, record.status),
    })
  }

  // 是否为容器实例
  const isContainer = product === 'zestu-container-instance'

  // 构建下拉菜单
  const getDropdownItems = (record: SKU): MenuProps['items'] => {
    const isOnline = record.status === 'available'
    const items: MenuProps['items'] = []

    // 上下架（危险操作）
    items.push({
      key: 'status',
      label: (
        <span style={{ color: isOnline ? '#ff4d4f' : '#52c41a' }}>
          {isOnline ? '下架' : '上架'}
        </span>
      ),
      onClick: () => handleStatusChangeConfirm(record),
    })

    return items
  }

  // 操作列
  const actionColumn: ColumnType<SKU> = {
    title: '操作',
    key: 'action',
    width: isContainer ? 160 : 120,
    fixed: 'right',
    render: (_: unknown, record: SKU) => (
      <Space size="small">
        {productConfig.editRoute ? (
          <Button type="link" size="small" onClick={() => handleEdit(record.id)}>
            编辑
          </Button>
        ) : (
          <Tooltip title="该产品暂不支持编辑">
            <Button type="link" size="small" disabled>
              编辑
            </Button>
          </Tooltip>
        )}
        {isContainer && (
          <Button type="link" size="small" onClick={() => handleCopy(record.id)}>
            复制
          </Button>
        )}
        <Dropdown menu={{ items: getDropdownItems(record) }} trigger={['click']}>
          <Button type="link" size="small">
            更多 <DownOutlined />
          </Button>
        </Dropdown>
      </Space>
    ),
  }

  // 合并产品列和操作列
  const columns = [...productConfig.columns, actionColumn]

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    onPaginationChange(newPagination.current || 1, newPagination.pageSize || 10)
  }

  // 计算表格宽度
  const scrollX = columns.reduce((acc, col) => acc + (Number(col.width) || 100), 0)

  return (
    <Table
      columns={columns}
      dataSource={skus}
      rowKey="id"
      loading={loading}
      scroll={{ x: scrollX }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条`,
      }}
      onChange={handleTableChange}
    />
  )
}
