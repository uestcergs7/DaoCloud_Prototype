import { useState, useEffect } from 'react'
import { Table, Input, Space, Tag, message, Select, DatePicker, Row, Col, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import { fetchProducts } from '../services/api'
import axios from 'axios'
import dayjs from 'dayjs'
import ExportModal from './ExportModal'

const { RangePicker } = DatePicker

const BillingTypeMap: Record<string, string> = {
    PAY_AS_YOU_GO: '按量付费',
    SUBSCRIPTION_DAILY: '包日',
    SUBSCRIPTION_WEEKLY: '包周',
    SUBSCRIPTION_MONTHLY: '包月',
    SUBSCRIPTION_YEARLY: '包年',
}

const BillTypeMap: Record<string, { text: string; color: string }> = {
    CONSUME: { text: '消费', color: 'blue' },
    REFUND: { text: '退款', color: 'orange' },
}

interface Bill {
    billId?: string
    orderId?: string
    productName?: string
    billingType?: string
    type?: string
    billingCycle?: {
        startTimestamp?: string
        endTimestamp?: string
    }
    amountDue?: string
    username?: string
}

interface Member {
    id: string
    name: string
}

interface UserBillsProps {
    userId: string
}

export default function UserBills({ userId }: UserBillsProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Bill[]>([])
    const [total, setTotal] = useState(0)
    const [products, setProducts] = useState<{ label: string; value: string }[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [exportModalOpen, setExportModalOpen] = useState(false)

    const [params, setParams] = useState({
        page: 1,
        pageSize: 10,
        billId: '',
        orderId: '',
        productName: undefined as string | undefined,
        billingType: undefined as string | undefined,
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
            if (params.billId) apiParams.billId = params.billId
            if (params.orderId) apiParams.orderId = params.orderId
            if (params.productName) apiParams.productName = params.productName
            if (params.billingType) apiParams.billingType = params.billingType
            if (params.username) apiParams.username = params.username
            if (params.start) apiParams.start = params.start
            if (params.end) apiParams.end = params.end

            const response = await axios.get(`/proxy/users/${userId}/bills`, { params: apiParams })
            setData(response.data.items || [])
            setTotal(response.data.pagination?.total || 0)
        } catch (error) {
            message.error('获取账单列表失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [params, userId])

    const columns: ColumnsType<Bill> = [
        {
            title: '账单号',
            dataIndex: 'billId',
            key: 'billId',
            width: 200,
        },
        {
            title: '用户',
            dataIndex: 'username',
            key: 'username',
            width: 120,
        },
        {
            title: '关联订单',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 200,
        },
        {
            title: '产品',
            dataIndex: 'productName',
            key: 'productName',
        },
        {
            title: '计费模式',
            dataIndex: 'billingType',
            key: 'billingType',
            render: (type: string) => <Tag>{BillingTypeMap[type] || type}</Tag>,
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                const config = BillTypeMap[type] || { text: type, color: 'default' }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: '计费周期',
            key: 'billingCycle',
            width: 300,
            render: (_, record) => {
                if (!record.billingCycle?.startTimestamp || !record.billingCycle?.endTimestamp) return '-'
                const startTs = Number(record.billingCycle.startTimestamp)
                const endTs = Number(record.billingCycle.endTimestamp)
                const startMs = startTs < 10000000000000 ? startTs * 1000 : startTs
                const endMs = endTs < 10000000000000 ? endTs * 1000 : endTs
                const start = dayjs(startMs).format('YYYY-MM-DD HH:mm:ss')
                const end = dayjs(endMs).format('YYYY-MM-DD HH:mm:ss')
                return `${start} ~ ${end}`
            },
        },
        {
            title: '应付金额',
            dataIndex: 'amountDue',
            key: 'amountDue',
            render: (amount: string) => `¥${Number(amount).toLocaleString()}`,
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
                        placeholder="账单号"
                        allowClear
                        onChange={(e) => handleSearch('billId', e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </Col>
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
                        onChange={(val) => handleSearch('productName', val)}
                        options={products}
                    />
                </Col>
                <Col span={4}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="计费模式"
                        allowClear
                        onChange={(val) => handleSearch('billingType', val)}
                        options={Object.keys(BillingTypeMap).map((k) => ({
                            label: BillingTypeMap[k],
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
                rowKey="billId"
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

            <ExportModal
                open={exportModalOpen}
                type="bills"
                userId={userId}
                onClose={() => setExportModalOpen(false)}
            />
        </Space>
    )
}
