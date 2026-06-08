import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, InputNumber, Input, Button, message, Typography, Spin, Tag, Row, Col } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { fetchSKUDetail, updateSKU } from '@/services/api'

const { Title } = Typography

export default function EditMaaSSKUPage() {
    const navigate = useNavigate()
    const { skuId } = useParams<{ skuId: string }>()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [modelName, setModelName] = useState('')
    const [tokenType, setTokenType] = useState('')

    useEffect(() => {
        if (skuId) {
            loadSKU(skuId)
        }
    }, [skuId])

    const loadSKU = async (id: string) => {
        try {
            const detail = await fetchSKUDetail(id)

            setModelName(detail.modelName || '')
            setTokenType(detail.tokenType || '')

            form.setFieldsValue({
                price: detail.price,
                description: detail.description || '',
                displayOrder: detail.displayOrder ?? 0,
            })
        } catch (error: any) {
            console.error('Failed to load SKU:', error)
            message.error('加载 SKU 详情失败')
        } finally {
            setPageLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!skuId) return
        try {
            const values = await form.validateFields()
            setLoading(true)

            await updateSKU(skuId, {
                price: values.price,
                description: values.description?.trim() || undefined,
                displayOrder: values.displayOrder ?? 0,
            })

            message.success('MaaS SKU 更新成功')
            navigate('/products/hydra-maas')
        } catch (error: any) {
            console.error('Failed to update MaaS SKU:', error)
            message.error(error?.response?.data?.message || error?.message || '更新失败')
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        )
    }

    const tokenTag = tokenType === 'input'
        ? <Tag color="blue">Input</Tag>
        : tokenType === 'output'
            ? <Tag color="orange">Output</Tag>
            : <Tag>{tokenType || '-'}</Tag>

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/products/hydra-maas')}
                    style={{ marginRight: 16 }}
                >
                    返回
                </Button>
                <Title level={4} style={{ display: 'inline', margin: 0 }}>
                    编辑 MaaS SKU
                </Title>
            </div>

            <Card>
                <Form form={form} layout="vertical">
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="模型名称">
                                <Input value={modelName} disabled />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Token 类型">
                                <div style={{ lineHeight: '32px' }}>{tokenTag}</div>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="price"
                        label="价格（微元）"
                        rules={[{ required: true, message: '请输入价格' }]}
                        extra="直接输入微元值。如 1600 = ¥0.0016/千Token"
                    >
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="描述"
                    >
                        <Input placeholder="SKU 描述" />
                    </Form.Item>

                    <Form.Item
                        name="displayOrder"
                        label="显示顺序"
                        extra="数字越小越靠前，默认 0"
                    >
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" loading={loading} onClick={handleSubmit}>
                            保存
                        </Button>
                        <Button style={{ marginLeft: 12 }} onClick={() => navigate('/products/hydra-maas')}>
                            取消
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
