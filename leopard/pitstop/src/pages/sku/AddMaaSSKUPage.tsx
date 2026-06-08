import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, InputNumber, Button, message, Typography, Row, Col } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { createMaaSSKU } from '@/services/api'

const { Option } = Select
const { Title } = Typography

export default function AddMaaSSKUPage() {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setLoading(true)

            const modelName = values.modelName.trim()
            const billingUnit = values.billingUnit

            // 阶段 1: 创建 Input SKU
            try {
                await createMaaSSKU({
                    modelName,
                    tokenType: 'input',
                    billingUnit,
                    price: values.inputPrice,
                })
            } catch (error: any) {
                console.error('Failed to create Input SKU:', error)
                message.error(`Input SKU 创建失败: ${error?.response?.data?.message || error?.message || '未知错误'}`)
                return
            }

            // 阶段 2: 创建 Output SKU
            try {
                await createMaaSSKU({
                    modelName,
                    tokenType: 'output',
                    billingUnit,
                    price: values.outputPrice,
                })
            } catch (error: any) {
                console.error('Failed to create Output SKU:', error)
                message.warning('Input SKU 已创建成功，但 Output SKU 创建失败。请在列表中检查。')
                navigate('/products/hydra-maas')
                return
            }

            message.success('MaaS SKU 创建成功（Input + Output）')
            navigate('/products/hydra-maas')
        } catch (error: any) {
            console.error('Form validation failed:', error)
        } finally {
            setLoading(false)
        }
    }

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
                    添加 MaaS SKU
                </Title>
            </div>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        billingUnit: 'k-token',
                        inputPrice: 1600,
                        outputPrice: 4800,
                    }}
                >
                    <Form.Item
                        name="modelName"
                        label="模型名称"
                        rules={[{ required: true, message: '请输入模型名称' }]}
                        extra="如 public/qwen2.5-72b-awq, public/glm4-9b"
                    >
                        <Input placeholder="模型的完整路径名" />
                    </Form.Item>

                    <Form.Item
                        name="billingUnit"
                        label="计费单位"
                        rules={[{ required: true, message: '请选择计费单位' }]}
                    >
                        <Select>
                            <Option value="k-token">按千 Token</Option>
                            <Option value="picture">按图片</Option>
                        </Select>
                    </Form.Item>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="inputPrice"
                                label="Input 价格（微元）"
                                rules={[{ required: true, message: '请输入 Input 价格' }]}
                                extra="如 1600 = ¥0.0016/千Token"
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="outputPrice"
                                label="Output 价格（微元）"
                                rules={[{ required: true, message: '请输入 Output 价格' }]}
                                extra="如 4800 = ¥0.0048/千Token"
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ color: '#666', fontSize: 12, marginBottom: 24 }}>
                        <p>• 将同时创建 Input 和 Output 两条 SKU</p>
                        <p>• MaaS SKU 不需要区域，不需要 GPU/CPU 配置</p>
                    </div>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" loading={loading} onClick={handleSubmit}>
                            创建
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
