import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Form, Input, Select, InputNumber, Button, message, Typography, Row, Col, Tooltip, Divider, Spin, Alert } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { createSKU, fetchGPUModels, fetchRegions, fetchSKUDetail, getDiscountRule } from '@/services/api'
import type { Region, AddSKUFormData, BillingType, DiscountRuleInfo } from '@/types/sku'
import { BILLING_TYPE_OPTIONS, BILLING_TYPE_PRICE_LABELS } from '@/types/sku'
import { getProductConfig } from '@/config/productConfig'

const { Option } = Select
const { Title } = Typography

interface AddContainerSKUPageProps {
  productName?: string
}

const getErrorMessage = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: { data?: unknown } }).response?.data &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message || '请求失败'
  }
  if (error instanceof Error) {
    return error.message
  }
  return '请求失败'
}

export default function AddSKUPage({ productName = 'zestu-container-instance' }: AddContainerSKUPageProps) {
  const productConfig = getProductConfig(productName)
  const billingOptions = productConfig.allowedBillingTypes
    ? BILLING_TYPE_OPTIONS.filter(opt => productConfig.allowedBillingTypes!.includes(opt.value))
    : BILLING_TYPE_OPTIONS
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const copyFromId = searchParams.get('copy')

  const [form] = Form.useForm()
  const [regions, setRegions] = useState<Region[]>([])
  const [gpuModels, setGpuModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(!!copyFromId)
  const [gpuType, setGpuType] = useState<'gpu' | 'vgpu'>('gpu')
  const [billingType, setBillingType] = useState<BillingType>('PAY_AS_YOU_GO')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountRulePreview, setDiscountRulePreview] = useState<DiscountRuleInfo | null>(null)
  const [discountError, setDiscountError] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const regionsData = await fetchRegions()
      setRegions(regionsData)

      // 如果是复制模式，加载源 SKU 数据
      if (copyFromId) {
        const skuDetail = await fetchSKUDetail(copyFromId)

        // 先加载 GPU 型号列表
        const models = await fetchGPUModels(skuDetail.regionName)
        setGpuModels(models)

        // 设置 GPU 类型
        const gpuTypeValue = skuDetail.gpuType as 'gpu' | 'vgpu' || 'gpu'
        setGpuType(gpuTypeValue)
        setBillingType(skuDetail.billingType)

        // 价格从微元转为元
        const priceInYuan = skuDetail.price / 1000000

        // 预填充表单
        form.setFieldsValue({
          product: productName,
          region: skuDetail.regionName,
          name: `${skuDetail.specName} (副本)`,
          billingType: skuDetail.billingType,
          price: priceInYuan,
          gpuModel: skuDetail.gpuModel,
          gpuType: gpuTypeValue,
          gpuCount: gpuTypeValue === 'gpu' ? parseInt(skuDetail.gpuCount) || 1 : undefined,
          gpuMemory: gpuTypeValue === 'gpu' ? (parseFloat(skuDetail.gpuMemory) / 1024) || undefined : undefined,
          vgpuPower: gpuTypeValue === 'vgpu' ? parseInt(skuDetail.vgpuPower) || undefined : undefined,
          vgpuMemory: gpuTypeValue === 'vgpu' ? (parseFloat(skuDetail.vgpuMemory) / 1024) || undefined : undefined,
          cpu: parseInt(skuDetail.cpu) || undefined,
          memory: (parseFloat(skuDetail.memory) / 1024) || undefined,
          displayOrder: 0, // 复制时显示顺序重置为 0
          discountRuleId: skuDetail.discountRuleId || '',
        })
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
      message.error('加载数据失败')
    } finally {
      setPageLoading(false)
    }
  }

  const handleRegionChange = async (region: string) => {
    form.setFieldsValue({ gpuModel: undefined })
    try {
      const models = await fetchGPUModels(region)
      setGpuModels(models)
    } catch (error) {
      console.error('Failed to fetch GPU models:', error)
    }
  }

  const handleGpuTypeChange = (value: 'gpu' | 'vgpu') => {
    setGpuType(value)
  }

  const handleBillingTypeChange = (value: BillingType) => {
    setBillingType(value)
    setDiscountError('')
    setDiscountRulePreview(null)
    if (value === 'PAY_AS_YOU_GO') {
      form.setFieldValue('discountRuleId', '')
    }
  }

  const handleCheckDiscountRule = async () => {
    const discountRuleId = (form.getFieldValue('discountRuleId') || '').trim()
    if (!discountRuleId) {
      message.warning('请先输入折扣ID')
      return
    }

    setDiscountLoading(true)
    setDiscountError('')
    setDiscountRulePreview(null)
    try {
      const rule = await getDiscountRule(discountRuleId)
      setDiscountRulePreview(rule)
    } catch (error: unknown) {
      setDiscountError(getErrorMessage(error))
    } finally {
      setDiscountLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const formData: AddSKUFormData = {
        product: productName,
        name: values.name.trim(),
        region: values.region,
        price: values.price,
        billingType: values.billingType,
        gpuModel: values.gpuModel,
        gpuVendor: values.gpuVendor || 'Nvidia',
        cpuVendor: values.cpuVendor || 'Intel',
        gpuType: values.gpuType,
        cpu: values.cpu,
        memory: values.memory,
        systemDisk: values.systemDisk || 0,
        computingUnit: values.computingUnit,
      }

      const discountRuleId = (values.discountRuleId || '').trim()
      if (values.billingType !== 'PAY_AS_YOU_GO' && discountRuleId) {
        formData.discountRuleId = discountRuleId
      }

      if (values.gpuType === 'gpu') {
        formData.gpuCount = values.gpuCount
        formData.gpuMemory = values.gpuMemory
      } else {
        formData.vgpuPower = values.vgpuPower
        formData.vgpuCount = values.vgpuCount
        formData.vgpuMemory = values.vgpuMemory
      }

      await createSKU(formData)
      message.success('SKU 添加成功')
      navigate(`/products/${productName}`)
    } catch (error: unknown) {
      console.error('Failed to add SKU:', error)
      message.error(getErrorMessage(error) || 'SKU 添加失败')
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/products/${productName}`)}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <Title level={4} style={{ display: 'inline', margin: 0 }}>
          添加{productConfig.label} SKU
        </Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            product: productName,
            billingType: 'PAY_AS_YOU_GO',
            gpuType: 'gpu',
            gpuCount: 1,
            gpuVendor: 'Nvidia',
            cpuVendor: 'Intel',
            computingUnit: 1,
            displayOrder: 0,
            discountRuleId: '',
          }}
        >
          <Title level={5}>基本信息</Title>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="product"
                label="产品类型"
              >
                <Tooltip title={productConfig.label}>
                  <Select disabled value={productName}>
                    <Option value={productName}>{productConfig.label}</Option>
                  </Select>
                </Tooltip>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label="区域"
                rules={[{ required: true, message: '请选择区域' }]}
              >
                <Select placeholder="请选择区域" onChange={handleRegionChange}>
                  {regions.map((region) => (
                    <Option key={region.regionId} value={region.regionId}>
                      {region.regionId}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="billingType"
                label="计费类型"
                rules={[{ required: true, message: '请选择计费类型' }]}
              >
                <Select placeholder="请选择计费类型" onChange={handleBillingTypeChange}>
                  {billingOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="SKU 规格名称"
                rules={[{ required: true, message: '请输入 SKU 规格名称' }]}
              >
                <Input placeholder="例如：NVIDIA-GeForce-RTX-4090 24GB" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="price"
                label={`SKU 销售价格（${BILLING_TYPE_PRICE_LABELS[billingType]}）`}
                rules={[{ required: true, message: '请输入 SKU 销售价格' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入价格"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayOrder"
                label="显示顺序"
                extra="数字越小越靠前，默认为 0"
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24} align="bottom">
            <Col span={16}>
              <Form.Item
                name="discountRuleId"
                label="折扣ID（可选）"
                extra={billingType === 'PAY_AS_YOU_GO' ? '按量付费不支持折扣' : '仅订阅计费类型生效'}
              >
                <Input
                  placeholder={billingType === 'PAY_AS_YOU_GO' ? '按量付费不支持折扣' : '手工输入折扣ID，例如 12'}
                  allowClear
                  disabled={billingType === 'PAY_AS_YOU_GO'}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Button
                onClick={handleCheckDiscountRule}
                loading={discountLoading}
                disabled={billingType === 'PAY_AS_YOU_GO'}
                style={{ width: '100%' }}
              >
                查看折扣信息
              </Button>
            </Col>
          </Row>
          {discountError ? (
            <Alert
              type="error"
              showIcon
              message="折扣查询失败"
              description={discountError}
              style={{ marginBottom: 16 }}
            />
          ) : null}
          {discountRulePreview ? (
            <Alert
              type="success"
              showIcon
              message={`折扣规则：${discountRulePreview.name || '-'}（ID: ${discountRulePreview.id}）`}
              description={discountRulePreview.meteringAmountsDiscounts.length > 0
                ? discountRulePreview.meteringAmountsDiscounts
                  .map((item) => `${item.meteringAmounts} -> ${(item.discountPercentage / 100).toFixed(2)}%`)
                  .join('，')
                : '该规则没有折扣阶梯'}
              style={{ marginBottom: 16 }}
            />
          ) : null}


          <Divider />
          <Title level={5}>GPU 配置</Title>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="gpuModel"
                label="GPU 型号"
                rules={[{ required: true, message: '请选择 GPU 型号' }]}
              >
                <Select
                  placeholder={gpuModels.length > 0 ? "请选择 GPU 型号" : "请先选择区域"}
                  disabled={gpuModels.length === 0}
                >
                  {gpuModels.map((model) => (
                    <Option key={model} value={model}>
                      {model}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gpuVendor"
                label="GPU 厂商"
                rules={[{ required: true, message: '请输入 GPU 厂商' }]}
              >
                <Input placeholder="如 Nvidia, Metax-GPU" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gpuType"
                label="GPU 类型"
                rules={[{ required: true, message: '请选择 GPU 类型' }]}
              >
                <Select onChange={handleGpuTypeChange}>
                  <Option value="gpu">GPU</Option>
                  <Option value="vgpu">vGPU</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {gpuType === 'gpu' && (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="gpuCount"
                  label="GPU 数量"
                  rules={[{ required: true, message: '请输入 GPU 数量' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gpuMemory"
                  label="GPU 显存（GB）"
                  rules={[{ required: true, message: '请输入 GPU 显存' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {gpuType === 'vgpu' && (
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="vgpuCount"
                  label="vGPU 数量"
                  rules={[{ required: true, message: '请输入 vGPU 数量' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="vgpuPower"
                  label="vGPU 算力（%）"
                  rules={[{ required: true, message: '请输入 vGPU 算力' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} max={100} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="vgpuMemory"
                  label="vGPU 显存（GB）"
                  rules={[{ required: true, message: '请输入 vGPU 显存' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider />
          <Title level={5}>计算资源</Title>

          <Row gutter={24}>
            <Col span={6}>
              <Form.Item
                name="cpu"
                label="CPU 核心数"
                rules={[{ required: true, message: '请输入 CPU 核心数' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="cpuVendor"
                label="CPU 厂商"
                rules={[{ required: true, message: '请输入 CPU 厂商' }]}
              >
                <Input placeholder="如 Intel, AMD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="memory"
                label="内存（GB）"
                rules={[{ required: true, message: '请输入内存大小' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="systemDisk"
                label="系统盘（GB）"
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="computingUnit"
                label="算力单元"
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              提交
            </Button>
            <Button style={{ marginLeft: 12 }} onClick={() => navigate(`/products/${productName}`)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
