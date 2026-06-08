import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, InputNumber, Button, message, Typography, Row, Col, Input, Spin, Descriptions } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { fetchSKUDetail, updateSKU } from '@/services/api'
import { getProductConfig } from '@/config/productConfig'
import type { SKUDetail } from '@/services/api'

const { Title } = Typography

interface EditStorageSKUPageProps {
    productName: string
}

export default function EditStorageSKUPage({ productName }: EditStorageSKUPageProps) {
    const productConfig = getProductConfig(productName)
    const navigate = useNavigate()
    const { skuId } = useParams<{ skuId: string }>()
    const [form] = Form.useForm()
    const [skuDetail, setSkuDetail] = useState<SKUDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (skuId) {
            loadSKUDetail()
        }
    }, [skuId])

    const loadSKUDetail = async () => {
        try {
            const detail = await fetchSKUDetail(skuId!)
            setSkuDetail(detail)

            form.setFieldsValue({
                price: detail.price,
                freeQuantity: detail.freeQuantity,
                displayOrder: detail.displayOrder,
                description: detail.description,
            })
        } catch (error) {
            console.error('Failed to load SKU detail:', error)
            message.error('加载 SKU 详情失败')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setSaving(true)

            await updateSKU(skuId!, {
                price: values.price,
                freeQuantity: values.freeQuantity,
                displayOrder: values.displayOrder,
                description: values.description,
            })

            message.success('SKU 更新成功')
            navigate(`/products/${productName}`)
        } catch (error: any) {
            console.error('Failed to update SKU:', error)
            message.error(error?.response?.data?.message || error?.message || '更新失败')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        )
    }

    if (!skuDetail) {
        return <div>SKU 不存在</div>
    }

    return (
        <div>
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/products/${productName}`)}
                style={{ marginBottom: 16, padding: 0 }}
            >
                返回{productConfig.label}列表
            </Button>

            <Card>
                <Title level={4} style={{ marginBottom: 24 }}>编辑{productConfig.label} SKU</Title>

                <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="SKU ID">{skuDetail.id}</Descriptions.Item>
                    <Descriptions.Item label="区域">{skuDetail.regionName}</Descriptions.Item>
                    <Descriptions.Item label="规格名称" span={2}>{skuDetail.specName}</Descriptions.Item>
                </Descriptions>

                <Form
                    form={form}
                    layout="vertical"
                    style={{ maxWidth: 600 }}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="价格（微元/GB/小时）"
                                rules={[{ required: true, message: '请输入价格' }]}
                                extra="9600 微元 = 0.0096 元"
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="freeQuantity"
                                label="免费额度（GB）"
                                rules={[{ required: true, message: '请输入免费额度' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="displayOrder"
                                label="显示顺序"
                                extra="数字越小越靠前"
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="描述"
                    >
                        <Input.TextArea rows={3} placeholder="可选" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" loading={saving} onClick={handleSubmit}>
                            保存
                        </Button>
                        <Button
                            style={{ marginLeft: 12 }}
                            onClick={() => navigate(`/products/${productName}`)}
                        >
                            取消
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
