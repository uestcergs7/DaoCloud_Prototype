import { useState, useEffect } from 'react'
import { Table, Input, Space, Tag, message, Row, Col, Button, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

interface Voucher {
    voucherId?: string
    description?: string
    status?: string
    totalAmount?: string
    remainingAmount?: string
    regions?: string[]
    effectTimestamp?: string
    expireTimestamp?: string
}

interface VoucherListProps {
    userId: string
    type: 'active' | 'expired'
}

function VoucherList({ userId, type }: VoucherListProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Voucher[]>([])
    const [total, setTotal] = useState(0)

    const [params, setParams] = useState({
        page: 1,
        pageSize: 10,
        voucherId: '',
    })

    const loadData = async () => {
        if (!userId) return
        setLoading(true)
        try {
            const apiParams: Record<string, unknown> = {
                page: params.page,
                pageSize: params.pageSize,
            }
            if (params.voucherId) apiParams.voucherId = params.voucherId

            const endpoint =
                type === 'active'
                    ? `/proxy/users/${userId}/vouchers`
                    : `/proxy/users/${userId}/vouchers/expired`

            const response = await axios.get(endpoint, { params: apiParams })
            setData(response.data.items || [])
            setTotal(response.data.pagination?.total || 0)
        } catch (error) {
            message.error('获取代金券列表失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [params, userId, type])

    const columns: ColumnsType<Voucher> = [
        {
            title: '代金券ID',
            dataIndex: 'voucherId',
            key: 'voucherId',
            width: 200,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default'
                let text = status
                if (status === 'Active') {
                    color = 'success'
                    text = '生效中'
                }
                if (status === 'Expired') {
                    color = 'error'
                    text = '已过期'
                }
                if (status === 'UsedUp') {
                    color = 'warning'
                    text = '已用完'
                }
                return <Tag color={color}>{text}</Tag>
            },
        },
        {
            title: '总金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (val) => (val ? `¥${(Number(val)).toFixed(2)}` : '-'),
        },
        {
            title: '剩余金额',
            dataIndex: 'remainingAmount',
            key: 'remainingAmount',
            render: (val) => (val ? `¥${(Number(val)).toFixed(2)}` : '-'),
        },
        {
            title: '适用区域',
            dataIndex: 'regions',
            key: 'regions',
            render: (regions: string[]) => {
                if (!regions || regions.length === 0) return '全部'
                return regions.join(', ')
            },
        },
        {
            title: '生效时间',
            dataIndex: 'effectTimestamp',
            key: 'effectTimestamp',
            render: (ts: string) => {
                if (!ts) return '-'
                const num = Number(ts)
                const ms = num < 10000000000000 ? num * 1000 : num
                return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: '过期时间',
            dataIndex: 'expireTimestamp',
            key: 'expireTimestamp',
            render: (ts: string) => {
                if (!ts) return '-'
                const num = Number(ts)
                const ms = num < 10000000000000 ? num * 1000 : num
                return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
            },
        },
    ]

    const handleSearch = (key: string, value: unknown) => {
        setParams((prev) => ({ ...prev, page: 1, [key]: value }))
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Input
                        placeholder="代金券ID"
                        allowClear
                        onChange={(e) => handleSearch('voucherId', e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </Col>
                <Col>
                    <Button icon={<ReloadOutlined />} onClick={loadData}>
                        刷新
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="voucherId"
                loading={loading}
                pagination={{
                    current: params.page,
                    pageSize: params.pageSize,
                    total: total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                        setParams((prev) => ({ ...prev, page, pageSize }))
                    },
                }}
            />
        </Space>
    )
}

interface UserVouchersProps {
    userId: string
}

export default function UserVouchers({ userId }: UserVouchersProps) {
    const tabItems = [
        {
            key: 'active',
            label: '活跃代金券',
            children: <VoucherList userId={userId} type="active" />,
        },
        {
            key: 'expired',
            label: '已过期代金券',
            children: <VoucherList userId={userId} type="expired" />,
        },
    ]

    return <Tabs items={tabItems} />
}
