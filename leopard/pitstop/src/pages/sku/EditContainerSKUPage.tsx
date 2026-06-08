import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Select, InputNumber, Button, message, Typography, Row, Col, Input, Spin, Descriptions, Alert } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { fetchSKUDetail, updateSKU, BILLING_POLICY_ID_MAP, getDiscountRule } from '@/services/api'
import type { SKUDetail } from '@/services/api'
import type { BillingType, DiscountRuleInfo } from '@/types/sku'
import { BILLING_TYPE_OPTIONS, BILLING_TYPE_PRICE_LABELS } from '@/types/sku'
import { getProductConfig } from '@/config/productConfig'

const { Title } = Typography

interface EditContainerSKUPageProps {
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

export default function EditContainerSKUPage({ productName = 'zestu-container-instance' }: EditContainerSKUPageProps) {
  const productConfig = getProductConfig(productName)
  const billingOptions = productConfig.allowedBillingTypes
    ? BILLING_TYPE_OPTIONS.filter(opt => productConfig.allowedBillingTypes!.includes(opt.value))
    : BILLING_TYPE_OPTIONS
  const navigate = useNavigate()
  const { skuId } = useParams<{ skuId: string }>()
  const [form] = Form.useForm()
  const [skuDetail, setSkuDetail] = useState<SKUDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingType, setBillingType] = useState<BillingType>('PAY_AS_YOU_GO')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountRulePreview, setDiscountRulePreview] = useState<DiscountRuleInfo | null>(null)
  const [discountError, setDiscountError] = useState('')

  useEffect(() => {
    if (skuId) {
      loadSKUDetail()
    }
  }, [skuId])

  const loadSKUDetail = async () => {
    try {
      const detail = await fetchSKUDetail(skuId!)
      setSkuDetail(detail)
      setBillingType(detail.billingType)

      // 价格转换为元
      const priceInYuan = detail.price / 1000000

      form.setFieldsValue({
        price: priceInYuan,
        billingType: detail.billingType,
        displayOrder: detail.displayOrder,
        description: detail.description,
        discountRuleId: detail.discountRuleId || '',
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

      // 价格转换为微元
      const priceInMicroYuan = Math.round(values.price * 1000000)

      await updateSKU(skuId!, {
        price: priceInMicroYuan,
        billingPolicyId: BILLING_POLICY_ID_MAP[values.billingType],
        displayOrder: values.displayOrder,
        description: values.description,
        discountRuleId: values.billingType === 'PAY_AS_YOU_GO' ? '' : (values.discountRuleId || '').trim(),
      })

      message.success('SKU 更新成功')
      navigate(`/products/${productName}`)
    } catch (error: unknown) {
      console.error('Failed to update SKU:', error)
      message.error(getErrorMessage(error) || '更新失败')
    } finally {
      setSaving(false)
    }
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

  // GPU 信息格式化
  const formatGpuMemory = (mb: string) => {
    const val = parseFloat(mb) || 0
    return val >= 1024 ? `${(val / 1024).toFixed(0)}GB` : `${val}MB`
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

        {/* 只读信息 */}
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="SKU ID">{skuDetail.id}</Descriptions.Item>
          <Descriptions.Item label="区域">{skuDetail.regionName}</Descriptions.Item>
          <Descriptions.Item label="规格名称" span={2}>{skuDetail.specName}</Descriptions.Item>
          <Descriptions.Item label="GPU 型号">{skuDetail.gpuModel || '-'}</Descriptions.Item>
          <Descriptions.Item label="GPU 类型">{skuDetail.gpuType || '-'}</Descriptions.Item>
          {skuDetail.gpuType === 'gpu' ? (
            <>
              <Descriptions.Item label="GPU 数量">{skuDetail.gpuCount || '-'}</Descriptions.Item>
              <Descriptions.Item label="GPU 显存">{formatGpuMemory(skuDetail.gpuMemory)}</Descriptions.Item>
            </>
          ) : (
            <>
              <Descriptions.Item label="vGPU 算力">{skuDetail.vgpuPower ? `${skuDetail.vgpuPower}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="vGPU 显存">{formatGpuMemory(skuDetail.vgpuMemory)}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="CPU">{skuDetail.cpu ? `${skuDetail.cpu}核` : '-'}</Descriptions.Item>
          <Descriptions.Item label="内存">{skuDetail.memory ? `${parseFloat(skuDetail.memory) / 1000}GB` : '-'}</Descriptions.Item>
        </Descriptions>

        {/* 可编辑表单 */}
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 600 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="price"
                label={`价格（${BILLING_TYPE_PRICE_LABELS[billingType]}）`}
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={4} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billingType"
                label="计费类型"
                rules={[{ required: true, message: '请选择计费类型' }]}
              >
                <Select onChange={handleBillingTypeChange}>
                  {billingOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
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
