import { useState, useEffect } from 'react'
import { Table, Input, Space, Tag, message, Select, DatePicker, Row, Col, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import { fetchProducts } from '../services/api'
import axios from 'axios'
import dayjs from 'dayjs'
import OrderDetailDrawer from './OrderDetailDrawer'
import ExportModal from './ExportModal'

const { RangePicker } = DatePicker

const OrderTypeMap: Record<string, string> = {
    PURCHASE: '新购',
    REFUND: '退费',
    UPGRADE: '升级',
    DOWNGRADE: '降级',
    TRANSFORM: '转换',
}

const OrderStatusMap: Record<string, { text: string; color: string }> = {
    PAID: { text: '已支付', color: 'success' },
    PARTIAL: { text: '部分支付', color: 'warning' },
    INVALIDATED: { text: '已作废', color: 'default' },
}

interface Order {
    orderId?: string
    productName?: string
    orderType?: string
    amountDue?: string
    orderPrice?: string
    orderStatus?: string
    createdAtTimestamp?: string
    username?: string
}

interface Member {
    id: string
    name: string
}

interface UserOrdersProps {
    userId: string
}

export default function UserOrders({ userId }: UserOrdersProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Order[]>([])
    const [total, setTotal] = useState(0)
    const [products, setProducts] = useState<{ label: string; value: string }[]>([])
    const [members, setMembers] = useState<Member[]>([])

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [exportModalOpen, setExportModalOpen] = useState(false)

    const [params, setParams] = useState({
        page: 1,
        pageSize: 10,
        orderId: '',
        productName: undefined as string | undefined,
        orderType: undefined as string | undefined,
        orderStatus: undefined as string | undefined,
        username: undefined as string | undefined,
        start: undefined as string | undefined,
        end: undefined as string | undefined,
    })

    useEffect(() => {
        fetchProducts().then((res) => {
            setProducts(res.map((p) => ({ label: p.name, value: p.name })))
        })
        // 加载子账号列表
        axios.get(`/proxy/users/${userId}/members?page=1&pageSize=100000`).then((res) => {
            setMembers(res.data.items || [])
        }).catch(() => { })
    }, [userId])

    const loadData = async () => {
        if (!userId) return
        setLoading(true)
        try {
            const apiParams: Record<string, unknown> = {
                page: params.page,
                pageSize: params.pageSize,
            }
            if (params.orderId) apiParams.orderId = params.orderId
            if (params.productName) apiParams.productName = params.productName
            if (params.orderType) apiParams.orderType = params.orderType
            if (params.orderStatus) apiParams.orderStatus = params.orderStatus
            if (params.username) apiParams.username = params.username
            if (params.start) apiParams.start = params.start
            if (params.end) apiParams.end = params.end

            const response = await axios.get(`/proxy/users/${userId}/orders`, { params: apiParams })
            setData(response.data.items || [])
            setTotal(response.data.pagination?.total || 0)
        } catch (error) {
            message.error('获取订单列表失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [params, userId])

    const handleOrderClick = (orderId: string) => {
        setSelectedOrderId(orderId)
        setDrawerOpen(true)
    }

    const columns: ColumnsType<Order> = [
        {
            title: '订单号',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 220,
            render: (orderId: string) => (
                <a onClick={() => handleOrderClick(orderId)} style={{ cursor: 'pointer' }}>
                    {orderId}
                </a>
            ),
        },
        {
            title: '用户',
            dataIndex: 'username',
            key: 'username',
            width: 120,
        },
        {
            title: '产品',
            dataIndex: 'productName',
            key: 'productName',
            render: (text) => {
                const product = products.find((p) => p.value === text)
                return product ? product.label : text
            },
        },
        {
            title: '类型',
            dataIndex: 'orderType',
            key: 'orderType',
            render: (type: string) => <Tag>{OrderTypeMap[type] || type}</Tag>,
        },
        {
            title: '金额',
            dataIndex: 'amountDue',
            key: 'amountDue',
            render: (val, record) => {
                const amount = val || record.orderPrice || '0'
                return `¥${Number(amount).toLocaleString()}`
            },
        },
        {
            title: '状态',
            dataIndex: 'orderStatus',
            key: 'orderStatus',
            render: (status: string) => {
                const config = OrderStatusMap[status] || { text: status, color: 'default' }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createdAtTimestamp',
            key: 'createdAtTimestamp',
            render: (date: string) => {
                const ts = Number(date)
                const ms = ts < 10000000000000 ? ts * 1000 : ts
                return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
            },
        },
    ]

    const handleSearch = (key: string, value: unknown) => {
        setParams((prev) => ({ ...prev, page: 1, [key]: value }))
    }

    const handleDateChange = (dates: unknown) => {
        if (dates && Array.isArray(dates)) {
            setParams((prev) => ({
                ...prev,
                page: 1,
                start: dates[0].valueOf().toString(),
                end: dates[1].valueOf().toString(),
            }))
        } else {
            setParams((prev) => ({
                ...prev,
                page: 1,
                start: undefined,
                end: undefined,
            }))
        }
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={[16, 16]}>
                <Col span={5}>
                    <Input
                        placeholder="订单号"
                        allowClear
                        onChange={(e) => handleSearch('orderId', e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </Col>
                <Col span={5}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="选择用户"
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        popupMatchSelectWidth={300}
                        options={[
                            { label: '全部用户', value: '' },
                            ...members.map((m) => {
                                const displayName = m.name.includes('#') ? m.name.split('#').pop() : m.name
                                return { label: displayName, value: m.name }
                            }),
                        ]}
                        onChange={(val) => handleSearch('username', val || undefined)}
                    />
                </Col>
                <Col span={5}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="选择产品"
                        allowClear
                        options={products}
                        onChange={(val) => handleSearch('productName', val)}
                    />
                </Col>
                <Col span={5}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="订单类型"
                        allowClear
                        onChange={(val) => handleSearch('orderType', val)}
                        options={Object.keys(OrderTypeMap).map((k) => ({
                            label: OrderTypeMap[k],
                            value: k,
                        }))}
                    />
                </Col>
                <Col span={4}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="订单状态"
                        allowClear
                        onChange={(val) => handleSearch('orderStatus', val)}
                        options={Object.keys(OrderStatusMap).map((k) => ({
                            label: OrderStatusMap[k].text,
                            value: k,
                        }))}
                    />
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <RangePicker style={{ width: '100%' }} onChange={handleDateChange} showTime />
                </Col>
                <Col>
                    <Button icon={<ReloadOutlined />} onClick={loadData}>
                        刷新
                    </Button>
                </Col>
                <Col>
                    <Button icon={<DownloadOutlined />} onClick={() => setExportModalOpen(true)}>
                        导出 Excel
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="orderId"
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

            <OrderDetailDrawer
                open={drawerOpen}
                orderId={selectedOrderId}
                userId={userId}
                onClose={() => setDrawerOpen(false)}
            />

            <ExportModal
                open={exportModalOpen}
                type="orders"
                userId={userId}
                onClose={() => setExportModalOpen(false)}
            />
        </Space>
    )
}
