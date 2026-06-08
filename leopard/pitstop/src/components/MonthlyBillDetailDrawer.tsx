import { useState, useEffect } from 'react'
import { Drawer, Table, Spin, message, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'

interface ProductBill {
    billingMonth?: string
    product?: string
    expenseType?: string
    orderPrice?: string
    voucherPayment?: string
    amountDue?: string
}

interface UserBill {
    billingMonth?: string
    userId?: string
    username?: string
    orderPrice?: string
    voucherPayment?: string
    amountDue?: string
}

interface RegionBill {
    billingMonth?: string
    region?: string
    orderPrice?: string
    voucherPayment?: string
    amountDue?: string
}

interface MonthlyBillDetailDrawerProps {
    open: boolean
    billingMonth: string | null
    userId: string
    onClose: () => void
}

export default function MonthlyBillDetailDrawer({ open, billingMonth, userId, onClose }: MonthlyBillDetailDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<ProductBill[]>([])
    const [users, setUsers] = useState<UserBill[]>([])
    const [regions, setRegions] = useState<RegionBill[]>([])

    useEffect(() => {
        if (open && billingMonth && userId) {
            loadDetail()
        }
    }, [open, billingMonth, userId])

    const loadDetail = async () => {
        if (!billingMonth || !userId) return
        setLoading(true)
        try {
            const res = await axios.get(`/proxy/users/${userId}/monthly-bills/${billingMonth}`)
            setProducts(res.data.products || [])
            setUsers(res.data.users || [])
            setRegions(res.data.regions || [])
        } catch (error) {
            message.error('获取月账单详情失败')
        } finally {
            setLoading(false)
        }
    }

    const productColumns: ColumnsType<ProductBill> = [
        { title: '产品', dataIndex: 'product', key: 'product' },
        { title: '类型', dataIndex: 'expenseType', key: 'expenseType' },
        { title: '订单金额', dataIndex: 'orderPrice', key: 'orderPrice', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
        { title: '代金券抵扣', dataIndex: 'voucherPayment', key: 'voucherPayment', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
        { title: '应付金额', dataIndex: 'amountDue', key: 'amountDue', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
    ]

    const userColumns: ColumnsType<UserBill> = [
        { title: '用户', dataIndex: 'username', key: 'username' },
        { title: '订单金额', dataIndex: 'orderPrice', key: 'orderPrice', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
        { title: '代金券抵扣', dataIndex: 'voucherPayment', key: 'voucherPayment', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
        { title: '应付金额', dataIndex: 'amountDue', key: 'amountDue', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
    ]

    const regionColumns: ColumnsType<RegionBill> = [
        { title: '区域', dataIndex: 'region', key: 'region' },
        { title: '订单金额', dataIndex: 'orderPrice', key: 'orderPrice', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
        { title: '代金券抵扣', dataIndex: 'voucherPayment', key: 'voucherPayment', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
        { title: '应付金额', dataIndex: 'amountDue', key: 'amountDue', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
    ]

    const tabItems = [
        {
            key: 'products',
            label: '按产品',
            children: <Table columns={productColumns} dataSource={products} rowKey={(r) => `${r.product}-${r.expenseType}`} size="small" pagination={{ pageSize: 10, showSizeChanger: true }} />,
        },
        {
            key: 'users',
            label: '按用户',
            children: <Table columns={userColumns} dataSource={users} rowKey="userId" size="small" pagination={{ pageSize: 10, showSizeChanger: true }} />,
        },
        {
            key: 'regions',
            label: '按区域',
            children: <Table columns={regionColumns} dataSource={regions} rowKey="region" size="small" pagination={{ pageSize: 10, showSizeChanger: true }} />,
        },
    ]

    return (
        <Drawer
            title={`月账单详情 - ${billingMonth || ''}`}
            placement="right"
            width={700}
            open={open}
            onClose={onClose}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Tabs items={tabItems} />
            )}
        </Drawer>
    )
}
