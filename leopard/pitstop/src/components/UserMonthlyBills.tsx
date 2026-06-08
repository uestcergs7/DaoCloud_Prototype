import { useState, useEffect } from 'react'
import { Table, Space, message, Row, Col, Button, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import MonthlyBillDetailDrawer from './MonthlyBillDetailDrawer'
import ExportModal from './ExportModal'

interface MonthlyBill {
    billingMonth?: string
    orderPrice?: string
    voucherPayment?: string
    amountDue?: string
}

interface UserMonthlyBillsProps {
    userId: string
}

export default function UserMonthlyBills({ userId }: UserMonthlyBillsProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<MonthlyBill[]>([])
    const [total, setTotal] = useState(0)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
    const [exportModalOpen, setExportModalOpen] = useState(false)

    const [params, setParams] = useState({
        page: 1,
        pageSize: 10,
        startMonth: undefined as string | undefined,
        endMonth: undefined as string | undefined,
    })

    const loadData = async () => {
        if (!userId) return
        setLoading(true)
        try {
            // 默认查询最近一年
            const now = new Date()
            const defaultEndMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            const defaultStartMonth = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`

            const apiParams: Record<string, unknown> = {
                page: params.page,
                pageSize: params.pageSize,
                startMonth: params.startMonth || defaultStartMonth,
                endMonth: params.endMonth || defaultEndMonth,
            }

            const response = await axios.get(`/proxy/users/${userId}/monthly-bills`, { params: apiParams })
            setData(response.data.items || [])
            setTotal(response.data.pagination?.total || 0)
        } catch (error) {
            message.error('获取月账单列表失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [params, userId])

    const handleMonthClick = (month: string) => {
        setSelectedMonth(month)
        setDrawerOpen(true)
    }

    const columns: ColumnsType<MonthlyBill> = [
        {
            title: '账单月份',
            dataIndex: 'billingMonth',
            key: 'billingMonth',
            render: (month: string) => (
                <a onClick={() => handleMonthClick(month)} style={{ cursor: 'pointer' }}>
                    {month}
                </a>
            ),
        },
        {
            title: '订单金额',
            dataIndex: 'orderPrice',
            key: 'orderPrice',
            render: (val) => `¥${Number(val || 0).toLocaleString()}`,
        },
        {
            title: '代金券抵扣',
            dataIndex: 'voucherPayment',
            key: 'voucherPayment',
            render: (val) => `¥${Number(val || 0).toLocaleString()}`,
        },
        {
            title: '应付金额',
            dataIndex: 'amountDue',
            key: 'amountDue',
            render: (val) => `¥${Number(val || 0).toLocaleString()}`,
        },
    ]

    const handleMonthChange = (dates: unknown, type: 'start' | 'end') => {
        if (dates) {
            const month = (dates as any).format('YYYY-MM')
            setParams((prev) => ({
                ...prev,
                page: 1,
                [type === 'start' ? 'startMonth' : 'endMonth']: month,
            }))
        } else {
            setParams((prev) => ({
                ...prev,
                page: 1,
                [type === 'start' ? 'startMonth' : 'endMonth']: undefined,
            }))
        }
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={[16, 16]}>
                <Col span={4}>
                    <DatePicker
                        picker="month"
                        placeholder="开始月份"
                        style={{ width: '100%' }}
                        onChange={(date) => handleMonthChange(date, 'start')}
                    />
                </Col>
                <Col span={4}>
                    <DatePicker
                        picker="month"
                        placeholder="结束月份"
                        style={{ width: '100%' }}
                        onChange={(date) => handleMonthChange(date, 'end')}
                    />
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
                rowKey="billingMonth"
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

            <MonthlyBillDetailDrawer
                open={drawerOpen}
                billingMonth={selectedMonth}
                userId={userId}
                onClose={() => setDrawerOpen(false)}
            />

            <ExportModal
                open={exportModalOpen}
                type="monthly-bills"
                userId={userId}
                onClose={() => setExportModalOpen(false)}
            />
        </Space>
    )
}
