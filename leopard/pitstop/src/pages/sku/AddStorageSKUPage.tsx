import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Select, InputNumber, Button, message, Typography, Row, Col, Alert } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { createStorageSKU, fetchRegions, fetchSKUs } from '@/services/api'
import { getProductConfig } from '@/config/productConfig'
import type { Region } from '@/types/sku'

const { Option } = Select
const { Title } = Typography

interface AddStorageSKUPageProps {
    productName: string
    defaultFreeQuantity?: number
}

export default function AddStorageSKUPage({
    productName,
    defaultFreeQuantity = 0,
}: AddStorageSKUPageProps) {
    const productConfig = getProductConfig(productName)
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [regions, setRegions] = useState<Region[]>([])
    const [existingRegions, setExistingRegions] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [selectedRegion, setSelectedRegion] = useState<string>('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [regionsData, skusData] = await Promise.all([
                fetchRegions(),
                fetchSKUs(1, 100, undefined, productName),
            ])
            setRegions(regionsData)
            setExistingRegions(new Set(skusData.data.map((sku) => sku.region)))
        } catch (error) {
            console.error('Failed to load data:', error)
            message.error('加载数据失败')
        }
    }

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value)
        form.setFieldsValue({ region: value })
    }

    const isRegionUsed = selectedRegion && existingRegions.has(selectedRegion)

    const handleSubmit = async () => {
        if (isRegionUsed) {
            message.error(`该区域已存在${productConfig.label} SKU`)
            return
        }

        try {
            const values = await form.validateFields()
            setLoading(true)

            await createStorageSKU(productName, values.region, {
                price: values.price,
                freeQuantity: values.freeQuantity,
            })

            message.success(`${productConfig.label} SKU 创建成功`)
            navigate(`/products/${productName}`)
        } catch (error: any) {
            console.error('Failed to create storage SKU:', error)
            message.error(error?.response?.data?.message || error?.message || '创建失败')
        } finally {
            setLoading(false)
        }
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
                <Title level={4} style={{ marginBottom: 24 }}>创建{productConfig.label} SKU</Title>

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        price: 9600,
                        freeQuantity: defaultFreeQuantity,
                    }}
                    style={{ maxWidth: 600 }}
                >
                    <Form.Item
                        name="region"
                        label="区域"
                        rules={[{ required: true, message: '请选择区域' }]}
                        validateStatus={isRegionUsed ? 'error' : undefined}
                        help={isRegionUsed ? `该区域已存在${productConfig.label} SKU，每个区域只能创建一个` : undefined}
                    >
                        <Select placeholder="请选择区域" onChange={handleRegionChange}>
                            {regions.map((region) => {
                                const used = existingRegions.has(region.regionId)
                                return (
                                    <Option key={region.regionId} value={region.regionId} disabled={used}>
                                        {region.regionId} {used && '(已存在)'}
                                    </Option>
                                )
                            })}
                        </Select>
                    </Form.Item>

                    {isRegionUsed && (
                        <Alert
                            type="warning"
                            message={`每个区域只能创建一个${productConfig.label} SKU`}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="价格（微元/GB/小时）"
                                rules={[{ required: true, message: '请输入价格' }]}
                                extra="默认 9600 = 0.0096 元"
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="freeQuantity"
                                label="免费额度（GB）"
                                rules={[{ required: true, message: '请输入免费额度' }]}
                                extra={`默认 ${defaultFreeQuantity} GB`}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ color: '#666', fontSize: 12, marginBottom: 24 }}>
                        <p>• 计费策略：按使用量计费（固定）</p>
                        <p>• 规格：使用系统默认{productConfig.label}规格</p>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            loading={loading}
                            onClick={handleSubmit}
                            disabled={!!isRegionUsed}
                        >
                            创建
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
