import { useState, useEffect } from 'react'
import { Table, Card, Input, Space, Tag, message, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchUsers, type User } from '../services/ghippo'
import dayjs from 'dayjs'

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)

  // 从 URL 恢复状态
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const search = searchParams.get('search') || ''

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchUsers({ page, pageSize, search: search || undefined })
      setData(response.items || [])
      setTotal(response.pagination?.total || 0)
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, pageSize, search])

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '' || (key === 'page' && value === 1) || (key === 'pageSize' && value === 10)) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    }
    setSearchParams(next, { replace: true })
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <Link to={`/users/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: '姓名',
      key: 'realname',
      render: (_, record) => {
        const first = record.firstname || ''
        const last = record.lastname || ''
        return `${last}${first}`.trim() || '-'
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'error'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(Number(date)).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => Number(a.createdAt) - Number(b.createdAt),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? dayjs(Number(date)).format('YYYY-MM-DD HH:mm:ss') : '-',
      sorter: (a, b) => Number(a.lastLoginAt || 0) - Number(b.lastLoginAt || 0),
    },
  ]

  const handleSearch = (value: string) => {
    updateParams({ page: 1, search: value || undefined })
  }

  return (
    <Card title="客户管理">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          message="点击用户名进入详情页，可查看该用户的钱包余额、订单记录、收支明细、账单、代金券等信息"
          type="info"
          showIcon
          closable
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Input.Search
            placeholder="搜索用户名..."
            allowClear
            defaultValue={search}
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            showQuickJumper: true,
            onChange: (p, ps) => {
              updateParams({ page: p, pageSize: ps })
            },
          }}
        />
      </Space>
    </Card>
  )
}
