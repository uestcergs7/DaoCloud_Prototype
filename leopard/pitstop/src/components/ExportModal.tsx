import { useState, useEffect } from 'react'
import { Modal, Form, DatePicker, Select, message, Alert } from 'antd'
import dayjs from 'dayjs'
import { fetchProducts } from '../services/api'

const { RangePicker } = DatePicker

interface ExportModalProps {
    open: boolean
    type: 'orders' | 'transactions' | 'bills' | 'monthly-bills'
    userId: string
    onClose: () => void
}

const OrderTypeOptions = [
    { label: '新购', value: 'PURCHASE' },
    { label: '退费', value: 'REFUND' },
    { label: '升级', value: 'UPGRADE' },
    { label: '降级', value: 'DOWNGRADE' },
    { label: '转换', value: 'TRANSFORM' },
]

const BillingTypeOptions = [
    { label: '按量付费', value: 'PAY_AS_YOU_GO' },
    { label: '包日', value: 'SUBSCRIPTION_DAILY' },
    { label: '包周', value: 'SUBSCRIPTION_WEEKLY' },
    { label: '包月', value: 'SUBSCRIPTION_MONTHLY' },
    { label: '包年', value: 'SUBSCRIPTION_YEARLY' },
]

export default function ExportModal({ open, type, userId, onClose }: ExportModalProps) {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<{ label: string; value: string }[]>([])

    useEffect(() => {
        if (open && (type === 'orders' || type === 'bills')) {
            fetchProducts().then((res) => {
                setProducts(res.map((p) => ({ label: p.name, value: p.name })))
            })
        }
    }, [open, type])

    const handleExport = async () => {
        try {
            const values = await form.validateFields()
            setLoading(true)

            const queryParams = new URLSearchParams()
            queryParams.set('exportType', 'excel')

            // 根据类型处理不同的参数
            if (type === 'monthly-bills') {
                // 月账单必须有 startMonth 和 endMonth
                if (!values.monthRange || values.monthRange.length !== 2) {
                    message.error('请选择月份范围')
                    setLoading(false)
                    return
                }
                // 校验月账单不超过1年
                const monthDiff = values.monthRange[1].diff(values.monthRange[0], 'month')
                if (monthDiff > 12) {
                    message.error('月账单导出时间范围不能超过1年')
                    setLoading(false)
                    return
                }
                queryParams.set('startMonth', values.monthRange[0].format('YYYY-MM'))
                queryParams.set('endMonth', values.monthRange[1].format('YYYY-MM'))
            } else {
                // 其他类型使用时间范围
                if (values.dateRange) {
                    // 校验时间范围不超过3个月
                    const daysDiff = values.dateRange[1].diff(values.dateRange[0], 'day')
                    if (daysDiff > 90) {
                        message.error('导出时间范围不能超过3个月')
                        setLoading(false)
                        return
                    }
                    // 导出 API 需要秒级时间戳
                    queryParams.set('start', Math.floor(values.dateRange[0].valueOf() / 1000).toString())
                    queryParams.set('end', Math.floor(values.dateRange[1].valueOf() / 1000).toString())
                }
                if (values.productName) queryParams.set('productName', values.productName)
                if (values.orderType) queryParams.set('orderType', values.orderType)
                if (values.billingType) queryParams.set('billingType', values.billingType)
            }

            window.open(`/proxy/users/${userId}/export/${type}?${queryParams.toString()}`, '_blank')
            onClose()
            form.resetFields()
        } catch (error) {
            // Form validation error
        } finally {
            setLoading(false)
        }
    }

    const getTitle = () => {
        switch (type) {
            case 'orders': return '导出订单'
            case 'transactions': return '导出收支明细'
            case 'bills': return '导出账单'
            case 'monthly-bills': return '导出月账单'
        }
    }

    const renderFields = () => {
        if (type === 'monthly-bills') {
            return (
                <>
                    <Alert
                        message="导出时间范围不能超过1年"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    <Form.Item
                        name="monthRange"
                        label="月份范围"
                        rules={[{ required: true, message: '请选择月份范围' }]}
                    >
                        <RangePicker
                            picker="month"
                            style={{ width: '100%' }}
                            defaultValue={[
                                dayjs().subtract(1, 'year'),
                                dayjs(),
                            ]}
                        />
                    </Form.Item>
                </>
            )
        }

        return (
            <>
                <Form.Item name="dateRange" label="时间范围">
                    <RangePicker
                        style={{ width: '100%' }}
                        showTime
                    />
                </Form.Item>

                {(type === 'orders' || type === 'bills') && (
                    <Form.Item name="productName" label="产品名称">
                        <Select allowClear placeholder="全部产品" options={products} />
                    </Form.Item>
                )}

                {type === 'orders' && (
                    <Form.Item name="orderType" label="订单类型">
                        <Select allowClear placeholder="全部类型" options={OrderTypeOptions} />
                    </Form.Item>
                )}

                {type === 'bills' && (
                    <Form.Item name="billingType" label="计费模式">
                        <Select allowClear placeholder="全部模式" options={BillingTypeOptions} />
                    </Form.Item>
                )}
            </>
        )
    }

    return (
        <Modal
            title={getTitle()}
            open={open}
            onOk={handleExport}
            onCancel={() => {
                onClose()
                form.resetFields()
            }}
            okText="导出"
            cancelText="取消"
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical">
                {renderFields()}
            </Form>
        </Modal>
    )
}
