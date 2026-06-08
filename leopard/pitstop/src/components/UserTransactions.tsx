import { useState, useEffect } from 'react'
import { Table, Input, Space, Tag, message, Select, DatePicker, Row, Col, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import ExportModal from './ExportModal'

const { RangePicker } = DatePicker

const PaymentTypeMap: Record<string, { text: string; color: string }> = {
    Income: { text: '收入', color: 'success' },
    Expense: { text: '支出', color: 'error' },
}

const TransactionTypeMap: Record<string, string> = {
    Consume: '消费',
    Charge: '充值',
}

const ChannelMap: Record<string, string> = {
    Balance: '余额',
    Alipay: '支付宝',
    // Wechat: '微信',
    Corporate_Transfer: '对公转账',
}

interface Transaction {
    serialNumber?: string
    transactionTimestamp?: string
    paymentType?: string
    transactionType?: string
    transactionChannel?: string
    amount?: string
    balance?: string
    username?: string
}

interface Member {
    id: string
    name: string
}

interface UserTransactionsProps {
    userId: string
}

export default function UserTransactions({ userId }: UserTransactionsProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Transaction[]>([])
    const [total, setTotal] = useState(0)
    const [exportModalOpen, setExportModalOpen] = useState(false)
    const [members, setMembers] = useState<Member[]>([])

    const [params, setParams] = useState({
        page: 1,
        pageSize: 10,
        serialNumber: '',
        paymentType: undefined as string | undefined,
        transactionType: undefined as string | undefined,
        transactionChannel: undefined as string | undefined,
        username: undefined as string | undefined,
        start: undefined as string | undefined,
        end: undefined as string | undefined,
    })

    useEffect(() => {
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
            if (params.serialNumber) apiParams.serialNumber = params.serialNumber
            if (params.paymentType) apiParams.paymentType = params.paymentType
            if (params.transactionType) apiParams.transactionType = params.transactionType
            if (params.transactionChannel) apiParams.transactionChannel = params.transactionChannel
            if (params.username) apiParams.username = params.username
            if (params.start) apiParams.start = params.start
            if (params.end) apiParams.end = params.end

            const response = await axios.get(`/proxy/users/${userId}/transactions`, { params: apiParams })
            setData(response.data.items || [])
            setTotal(response.data.pagination?.total || 0)
        } catch (error) {
            message.error('获取收支明细失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [params, userId])

    const columns: ColumnsType<Transaction> = [
        {
            title: '流水号',
            dataIndex: 'serialNumber',
            key: 'serialNumber',
            width: 200,
        },
        {
            title: '用户',
            dataIndex: 'username',
            key: 'username',
            width: 120,
        },
        {
            title: '时间',
            dataIndex: 'transactionTimestamp',
            key: 'transactionTimestamp',
            render: (date: string) => {
                const ts = Number(date)
                const ms = ts < 10000000000000 ? ts * 1000 : ts
                return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
            },
            width: 180,
        },
        {
            title: '收支类型',
            dataIndex: 'paymentType',
            key: 'paymentType',
            render: (type: string) => {
                const config = PaymentTypeMap[type] || { text: type, color: 'default' }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: '交易类型',
            dataIndex: 'transactionType',
            key: 'transactionType',
            render: (type: string) => <Tag>{TransactionTypeMap[type] || type}</Tag>,
        },
        {
            title: '渠道',
            dataIndex: 'transactionChannel',
            key: 'transactionChannel',
            render: (channel: string) => ChannelMap[channel] || channel,
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) => `¥${Number(amount).toLocaleString()}`,
        },
        {
            title: '余额',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance: string) => `¥${Number(balance).toLocaleString()}`,
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
                        placeholder="流水号"
                        allowClear
                        onChange={(e) => handleSearch('serialNumber', e.target.value)}
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
                <Col span={4}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="收支类型"
                        allowClear
                        onChange={(val) => handleSearch('paymentType', val)}
                        options={Object.keys(PaymentTypeMap).map((k) => ({
                            label: PaymentTypeMap[k].text,
                            value: k,
                        }))}
                    />
                </Col>
                <Col span={4}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="交易类型"
                        allowClear
                        onChange={(val) => handleSearch('transactionType', val)}
                        options={Object.keys(TransactionTypeMap).map((k) => ({
                            label: TransactionTypeMap[k],
                            value: k,
                        }))}
                    />
                </Col>
                <Col span={4}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="渠道"
                        allowClear
                        onChange={(val) => handleSearch('transactionChannel', val)}
                        options={Object.keys(ChannelMap).map((k) => ({
                            label: ChannelMap[k],
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
                rowKey="serialNumber"
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
                type="transactions"
                userId={userId}
                onClose={() => setExportModalOpen(false)}
            />
        </Space>
    )
}
