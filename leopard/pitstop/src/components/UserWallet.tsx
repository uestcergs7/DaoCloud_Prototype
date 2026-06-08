import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Tag, Spin, message, Button, Modal, Form, Input, InputNumber } from 'antd'
import { WalletOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined, GiftOutlined, BankOutlined } from '@ant-design/icons'
import axios from 'axios'
import { corporateTransferRecharge } from '../services/leopard'

interface WalletBalance {
    balance?: string
    isVirtual?: boolean
    alertsEnabled?: boolean
    mainAccountInArrears?: boolean
}

interface VoucherStat {
    amount?: string
    count?: number
}

interface UserWalletProps {
    userId: string
    isMainAccount?: boolean
    canTransferToMain?: boolean
}

export default function UserWallet({ userId, isMainAccount, canTransferToMain }: UserWalletProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<WalletBalance | null>(null)
    const [voucherStat, setVoucherStat] = useState<VoucherStat | null>(null)
    const [rechargeVisible, setRechargeVisible] = useState(false)
    const [rechargeLoading, setRechargeLoading] = useState(false)
    const [form] = Form.useForm()

    const loadData = async () => {
        if (!userId) return
        setLoading(true)
        try {
            const [walletRes, voucherRes] = await Promise.all([
                axios.get(`/proxy/users/${userId}/wallet/balance`),
                axios.get(`/proxy/users/${userId}/vouchers/stat`),
            ])
            setData(walletRes.data)
            setVoucherStat(voucherRes.data)
        } catch (error) {
            console.error('Failed to fetch wallet data:', error)
            message.error('获取钱包数据失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [userId])

    const handleRechargeSubmit = async () => {
        try {
            const values = await form.validateFields()
            setRechargeLoading(true)
            // amount 用户输入的是元，转换为分
            const amountInCents = String(Math.round(values.amount * 100))
            await corporateTransferRecharge({
                userId,
                amount: amountInCents,
                serialNumber: values.serialNumber,
                message: values.message || undefined,
                paymentSourceInfo: {
                    accountName: values.accountName || undefined,
                    bankAccount: values.bankAccount || undefined,
                    bankName: values.bankName || undefined,
                },
            })
            message.success('对公转账充值提交成功')
            setRechargeVisible(false)
            form.resetFields()
            loadData()
        } catch (error: any) {
            if (error?.errorFields) return // form validation error
            console.error('Corporate transfer recharge failed:', error)
            const detail = error?.response?.data?.message || error?.message || '未知错误'
            message.error(`充值失败: ${detail}`)
        } finally {
            setRechargeLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        )
    }

    // 余额直接使用，API 返回的单位已经是元
    const balanceYuan = data?.balance ? Number(data.balance).toFixed(2) : '0.00'
    const voucherAmount = voucherStat?.amount ? Number(voucherStat.amount).toFixed(2) : '0.00'

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {(isMainAccount || canTransferToMain) && (
                    <Button type="primary" icon={<BankOutlined />} onClick={() => setRechargeVisible(true)}>
                        对公转账充值
                    </Button>
                )}
                <Button icon={<ReloadOutlined />} onClick={loadData}>
                    刷新
                </Button>
            </div>

            <Row gutter={[24, 24]}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="现金余额"
                            value={balanceYuan}
                            prefix={<WalletOutlined />}
                            suffix="元"
                            precision={2}
                            valueStyle={{ color: Number(balanceYuan) >= 0 ? '#3f8600' : '#cf1322' }}
                        />
                    </Card>
                </Col>

                <Col span={8}>
                    <Card>
                        <Statistic
                            title="代金券余额"
                            value={voucherAmount}
                            prefix={<GiftOutlined />}
                            suffix={<span>元 <Tag color="blue">{voucherStat?.count || 0} 张</Tag></span>}
                            precision={2}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>

                <Col span={8}>
                    <Card>
                        <Statistic
                            title="账户状态"
                            value={data?.mainAccountInArrears ? '欠费' : '正常'}
                            prefix={data?.mainAccountInArrears ? <WarningOutlined /> : <CheckCircleOutlined />}
                            valueStyle={{ color: data?.mainAccountInArrears ? '#cf1322' : '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
                <Col span={8}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>余额告警:</span>
                            <Tag color={data?.alertsEnabled ? 'success' : 'default'}>
                                {data?.alertsEnabled ? '已启用' : '未启用'}
                            </Tag>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Modal
                title="对公转账充值"
                open={rechargeVisible}
                onOk={handleRechargeSubmit}
                onCancel={() => { setRechargeVisible(false); form.resetFields() }}
                confirmLoading={rechargeLoading}
                okText="提交"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="amount"
                        label="充值金额（元）"
                        rules={[
                            { required: true, message: '请输入充值金额' },
                            { type: 'number', min: 0.01, message: '金额必须大于 0' },
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="请输入充值金额"
                            precision={2}
                            min={0.01}
                            addonAfter="元"
                        />
                    </Form.Item>
                    <Form.Item
                        name="serialNumber"
                        label="银行交易流水号"
                        rules={[{ required: true, message: '请输入银行交易流水号' }]}
                    >
                        <Input placeholder="请输入银行交易流水号" />
                    </Form.Item>
                    <Form.Item name="accountName" label="汇款账户名称">
                        <Input placeholder="请输入汇款账户名称" />
                    </Form.Item>
                    <Form.Item name="bankAccount" label="汇款银行账号">
                        <Input placeholder="请输入汇款银行账号" />
                    </Form.Item>
                    <Form.Item name="bankName" label="开户银行">
                        <Input placeholder="请输入开户银行名称" />
                    </Form.Item>
                    <Form.Item name="message" label="备注">
                        <Input.TextArea placeholder="请输入备注信息" rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
