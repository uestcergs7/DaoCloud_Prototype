import { useState, useEffect } from 'react'
import { Drawer, Descriptions, Table, Tag, Spin, Divider, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'

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

const BillingTypeMap: Record<string, string> = {
    PAY_AS_YOU_GO: '按量付费',
    SUBSCRIPTION_DAILY: '包日',
    SUBSCRIPTION_WEEKLY: '包周',
    SUBSCRIPTION_MONTHLY: '包月',
    SUBSCRIPTION_YEARLY: '包年',
}

interface OrderInfo {
    orderId?: string
    createdAtTimestamp?: string
    orderType?: string
    orderStatus?: string
    orderPrice?: string
    amountDue?: string
    username?: string
    userId?: string
}

interface ProductInfo {
    productName?: string
    resourceNum?: number
    specification?: string
    billingType?: string
    start?: string
    end?: string
    resources?: { name?: string; id?: string }[]
}

interface RelatedBill {
    billId?: string
    orderId?: string
    productName?: string
    billingType?: string
    type?: string
    amountDue?: string
    billingCycle?: {
        startTimestamp?: string
        endTimestamp?: string
    }
}

interface OrderDetailDrawerProps {
    open: boolean
    orderId: string | null
    userId: string
    onClose: () => void
}

export default function OrderDetailDrawer({ open, orderId, userId, onClose }: OrderDetailDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
    const [productInfo, setProductInfo] = useState<ProductInfo[]>([])
    const [relatedBills, setRelatedBills] = useState<RelatedBill[]>([])

    useEffect(() => {
        if (open && orderId && userId) {
            loadOrderDetail()
        }
    }, [open, orderId, userId])

    const loadOrderDetail = async () => {
        if (!orderId || !userId) return
        setLoading(true)
        try {
            // 获取订单详情
            const orderRes = await axios.get(`/proxy/users/${userId}/orders/${orderId}`)
            setOrderInfo(orderRes.data.orderInfo || null)
            setProductInfo(orderRes.data.productInfo || [])

            // 获取关联账单
            const billsRes = await axios.get(`/proxy/users/${userId}/bills?orderId=${orderId}&page=1&pageSize=100`)
            setRelatedBills(billsRes.data.items || [])
        } catch (error) {
            message.error('获取订单详情失败')
        } finally {
            setLoading(false)
        }
    }

    const formatTimestamp = (ts?: string) => {
        if (!ts) return '-'
        const num = Number(ts)
        const ms = num < 10000000000000 ? num * 1000 : num
        return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
    }

    const billColumns: ColumnsType<RelatedBill> = [
        {
            title: '账单号',
            dataIndex: 'billId',
            key: 'billId',
            ellipsis: true,
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
            title: '计费周期',
            key: 'billingCycle',
            render: (_, record: RelatedBill) => {
                if (!record.billingCycle?.startTimestamp || !record.billingCycle?.endTimestamp) return '-'
                return `${formatTimestamp(record.billingCycle.startTimestamp)} ~ ${formatTimestamp(record.billingCycle.endTimestamp)}`
            },
        },
        {
            title: '应付金额',
            dataIndex: 'amountDue',
            key: 'amountDue',
            render: (amount: string) => `¥${Number(amount).toLocaleString()}`,
        },
    ]

    return (
        <Drawer
            title={`订单详情 - ${orderId || ''}`}
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
                <>
                    {/* 订单信息 */}
                    <Descriptions title="订单信息" bordered column={2} size="small">
                        <Descriptions.Item label="订单号">{orderInfo?.orderId || '-'}</Descriptions.Item>
                        <Descriptions.Item label="用户">{orderInfo?.username || '-'}</Descriptions.Item>
                        <Descriptions.Item label="订单类型">
                            <Tag>{OrderTypeMap[orderInfo?.orderType || ''] || orderInfo?.orderType || '-'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="订单状态">
                            {orderInfo?.orderStatus ? (
                                <Tag color={OrderStatusMap[orderInfo.orderStatus]?.color || 'default'}>
                                    {OrderStatusMap[orderInfo.orderStatus]?.text || orderInfo.orderStatus}
                                </Tag>
                            ) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="订单金额">¥{Number(orderInfo?.orderPrice || 0).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="应付金额">¥{Number(orderInfo?.amountDue || 0).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="创建时间" span={2}>{formatTimestamp(orderInfo?.createdAtTimestamp)}</Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    {/* 产品信息 */}
                    <h4>产品信息</h4>
                    {productInfo.length === 0 ? (
                        <div style={{ color: '#999' }}>暂无产品信息</div>
                    ) : (
                        productInfo.map((product, index) => (
                            <Descriptions key={index} bordered column={2} size="small" style={{ marginBottom: 16 }}>
                                <Descriptions.Item label="产品名称">{product.productName || '-'}</Descriptions.Item>
                                <Descriptions.Item label="资源数量">{product.resourceNum || '-'}</Descriptions.Item>
                                <Descriptions.Item label="计费模式">
                                    <Tag>{BillingTypeMap[product.billingType || ''] || product.billingType || '-'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="资源ID">
                                    {product.resources?.map(r => r.id).join(', ') || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="开始时间">{formatTimestamp(product.start)}</Descriptions.Item>
                                <Descriptions.Item label="结束时间">{formatTimestamp(product.end)}</Descriptions.Item>
                                {product.specification && (
                                    <Descriptions.Item label="规格配置" span={2}>
                                        <pre style={{ margin: 0, fontSize: 12, maxHeight: 150, overflow: 'auto' }}>
                                            {(() => {
                                                try {
                                                    return JSON.stringify(JSON.parse(product.specification), null, 2)
                                                } catch {
                                                    return product.specification
                                                }
                                            })()}
                                        </pre>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        ))
                    )}

                    <Divider />

                    {/* 关联账单 */}
                    <h4>关联账单</h4>
                    <Table
                        columns={billColumns}
                        dataSource={relatedBills}
                        rowKey="billId"
                        size="small"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                        }}
                    />
                </>
            )}
        </Drawer>
    )
}
