
import { useState } from 'react'
import { Form, Input, InputNumber, Button, DatePicker, Select, Card, message, Typography, Radio } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { batchCreateVouchers } from '@/services/leopard'
import { useRegions } from '@/hooks/useRegions'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

export default function CreateVoucherPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { regions, loading: regionsLoading } = useRegions()
  const [submitting, setSubmitting] = useState(false)
  const [createdVouchers, setCreatedVouchers] = useState<string[]>([])
  const [validityType, setValidityType] = useState<'days' | 'date'>('days')

  const onFinish = async (values: any) => {
    setSubmitting(true)
    try {
      const payload: any = {
        description: values.description,
        totalAmount: values.totalAmount ? Math.round(values.totalAmount * 1000000).toString() : undefined,
        quantity: values.quantity,
        regions: values.regions,
      }

      if (validityType === 'days') {
        payload.effectiveDays = values.effectiveDays
      } else {
        payload.expireTimestamp = values.expireTimestamp ? dayjs(values.expireTimestamp).unix().toString() : undefined
      }

      const res = await batchCreateVouchers(payload)
      if (res && res.voucherIds) {
        setCreatedVouchers(res.voucherIds)
        message.success('代金券创建成功')
      } else {
        navigate('/vouchers')
      }
    } catch (error) {
      console.error(error)
      message.error('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleValidityTypeChange = (e: any) => {
    setValidityType(e.target.value)
    // Clear values when switching
    if (e.target.value === 'days') {
      form.setFieldValue('expireTimestamp', null)
    } else {
      form.setFieldValue('effectiveDays', null)
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([createdVouchers.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `vouchers-${dayjs().format('YYYYMMDDHHmmss')}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  }

  if (createdVouchers.length > 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography.Title level={3}>创建成功</Typography.Title>
          <Typography.Paragraph>
            成功创建 {createdVouchers.length} 张代金券
          </Typography.Paragraph>

          <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '20px auto', width: '300px', border: '1px solid #f0f0f0', padding: '10px' }}>
            {createdVouchers.map(id => (
              <div key={id}>{id}</div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <Button type="primary" onClick={handleDownload} style={{ marginRight: 12 }}>
              下载 .txt
            </Button>
            <Button onClick={() => setCreatedVouchers([])}>
              继续创建
            </Button>
            <Button type="link" onClick={() => navigate('/vouchers')}>
              返回列表
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>创建代金券</Title>
      <Card bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ quantity: 1, effectiveDays: 30 }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入代金券描述' }]}
          >
            <TextArea rows={4} placeholder="请输入代金券描述" />
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="金额 (元)"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={10}
              placeholder="例如: 50 即 50 元"
              precision={2}
              addonAfter="元"
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="生成数量"
            rules={[{ required: true, message: '请输入生成数量' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} max={100} precision={0} />
          </Form.Item>

          <Form.Item label="有效期类型" required>
            <Radio.Group value={validityType} onChange={handleValidityTypeChange}>
              <Radio value="days">有效天数</Radio>
              <Radio value="date">激活截止时间</Radio>
            </Radio.Group>
          </Form.Item>

          {validityType === 'days' && (
            <Form.Item
              name="effectiveDays"
              label="有效期 (天)"
              rules={[{ required: true, message: '请输入有效期天数' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} precision={0} placeholder="激活后多少天内有效" />
            </Form.Item>
          )}

          {validityType === 'date' && (
            <Form.Item
              name="expireTimestamp"
              label="激活截止时间"
              rules={[{ required: true, message: '请选择激活截止时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} placeholder="在此时间前必须激活" />
            </Form.Item>
          )}

          <Form.Item name="regions" label="适用区域">
            <Select
              mode="multiple"
              placeholder="如果不选则适用所有区域"
              loading={regionsLoading}
              allowClear
            >
              {regions.map(r => (
                <Option key={r.regionId} value={r.regionId}>{r.regionId}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              立即创建
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate(-1)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
