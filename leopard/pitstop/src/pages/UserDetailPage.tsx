import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Spin, message, Tabs, Alert, Modal, Form, Input, Radio } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons'
import { fetchUserDetail, fetchUserCertifyInfo, updateUserCertify, type User } from '../services/ghippo'
import axios from 'axios'
import dayjs from 'dayjs'
import UserWallet from '../components/UserWallet'
import UserMembers from '../components/UserMembers'
import UserOrders from '../components/UserOrders'
import UserTransactions from '../components/UserTransactions'
import UserBills from '../components/UserBills'
import UserMonthlyBills from '../components/UserMonthlyBills'
import UserVouchers from '../components/UserVouchers'

interface CurrentUser {
  isMainAccount?: boolean
  isSubAccount?: boolean
  hasCertified?: boolean
  mainAccountName?: string
  canTransferToMain?: boolean
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentUserLoading, setCurrentUserLoading] = useState(false)

  // 认证 Modal
  const [certModalOpen, setCertModalOpen] = useState(false)
  const [certLoading, setCertLoading] = useState(false)
  const [certSubmitting, setCertSubmitting] = useState(false)
  const [isIndividualCert, setIsIndividualCert] = useState(false)
  const [certForm] = Form.useForm()

  useEffect(() => {
    if (userId) {
      loadUser(userId)
      loadCurrentUser(userId)
    }
  }, [userId])

  const loadUser = async (id: string) => {
    setLoading(true)
    try {
      const data = await fetchUserDetail(id)
      setUser(data)
    } catch (error) {
      console.error('Failed to fetch user detail:', error)
      message.error('获取用户详情失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUser = async (id: string) => {
    setCurrentUserLoading(true)
    try {
      const response = await axios.get(`/proxy/users/${id}/current-user`)
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      // 非 SaaS 用户可能获取失败，不显示错误
      setCurrentUser(null)
    } finally {
      setCurrentUserLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleOpenCertModal = async () => {
    certForm.resetFields()
    certForm.setFieldsValue({ subject: 'Enterprise' })
    setIsIndividualCert(false)
    setCertModalOpen(true)
    if (!userId) return

    setCertLoading(true)
    try {
      const info = await fetchUserCertifyInfo(userId)
      setIsIndividualCert(info.subject === 'Individual')
      if (info.certName || info.certNo) {
        certForm.setFieldsValue({
          subject: info.subject === 'Individual' ? 'Enterprise' : (info.subject || 'Enterprise'),
          certName: info.subject === 'Individual' ? '' : info.certName,
          certNo: info.subject === 'Individual' ? '' : info.certNo,
        })
      }
    } catch {
      // 未认证用户可能返回空/404，静默处理
    } finally {
      setCertLoading(false)
    }
  }

  const handleCertSubmit = async () => {
    if (!userId) return
    try {
      const values = await certForm.validateFields()
      setCertSubmitting(true)
      await updateUserCertify({
        userId,
        certName: values.certName,
        certNo: values.certNo,
        subject: values.subject,
      })
      message.success('实名认证已更新')
      setCertModalOpen(false)
      loadCurrentUser(userId)
    } catch (error: any) {
      if (error?.errorFields) return
      console.error('Failed to update certify:', error)
      message.error('认证更新失败')
    } finally {
      setCertSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return <div>User not found</div>
  }

  // 判断是否为 SaaS 用户
  // SaaS 用户判断：主账号、子账号、或已注册但未启用子账号功能（canTransferToMain）
  const isSaasUser = currentUser?.isMainAccount || currentUser?.isSubAccount || currentUser?.canTransferToMain

  // 获取账户类型标签
  const getAccountTypeTag = () => {
    if (currentUserLoading) return <Spin size="small" />
    if (!currentUser) return <Tag>普通用户</Tag>
    if (currentUser.isMainAccount) return <Tag color="blue">主账号</Tag>
    if (currentUser.isSubAccount) return (
      <span>
        <Tag color="green">子账号</Tag>
        {currentUser.mainAccountName && <span style={{ marginLeft: 8, color: '#666' }}>（主账号：{currentUser.mainAccountName}）</span>}
      </span>
    )
    if (currentUser.canTransferToMain) return <Tag color="cyan">独立账号</Tag>
    return <Tag>普通用户</Tag>
  }

  // 获取认证状态
  const getCertificationStatus = () => {
    if (currentUserLoading) return <Spin size="small" />
    if (!currentUser) return '-'
    return currentUser.hasCertified ? (
      <Tag icon={<CheckCircleOutlined />} color="success">已认证</Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="default">未认证</Tag>
    )
  }

  // 仅 SaaS 用户显示财务相关 Tab
  const tabItems = isSaasUser ? [
    {
      key: 'wallet',
      label: '钱包',
      children: <UserWallet userId={userId!} isMainAccount={currentUser?.isMainAccount} canTransferToMain={currentUser?.canTransferToMain} />,
    },
    {
      key: 'members',
      label: '子账号',
      children: <UserMembers userId={userId!} isMainAccount={currentUser?.isMainAccount} />,
    },
    {
      key: 'orders',
      label: '订单',
      children: <UserOrders userId={userId!} />,
    },
    {
      key: 'transactions',
      label: '收支明细',
      children: <UserTransactions userId={userId!} />,
    },
    {
      key: 'bills',
      label: '账单明细',
      children: <UserBills userId={userId!} />,
    },
    {
      key: 'monthly-bills',
      label: '月账单',
      children: <UserMonthlyBills userId={userId!} />,
    },
    {
      key: 'vouchers',
      label: '代金券',
      children: <UserVouchers userId={userId!} />,
    },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>
      </div>

      <Card title="基本信息" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="用户名">{user.name}</Descriptions.Item>
          <Descriptions.Item label="姓名">
            {user.lastname}{user.firstname}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={user.enabled ? 'success' : 'error'}>
              {user.enabled ? '启用' : '禁用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="账户类型">{getAccountTypeTag()}</Descriptions.Item>
          <Descriptions.Item label="实名认证">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {getCertificationStatus()}
              {isSaasUser && (
                <Button size="small" icon={<EditOutlined />} onClick={handleOpenCertModal}>
                  编辑
                </Button>
              )}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(Number(user.createdAt)).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user.lastLoginAt ? dayjs(Number(user.lastLoginAt)).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {user.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isSaasUser ? (
        <Card bordered={false}>
          <Tabs items={tabItems} destroyInactiveTabPane />
        </Card>
      ) : (
        <Alert
          message="非 SaaS 用户"
          description="该用户不是主账号或子账号，无法查看钱包、订单、账单等财务信息。"
          type="info"
          showIcon
        />
      )}

      <Modal
        title="编辑实名认证"
        open={certModalOpen}
        onCancel={() => setCertModalOpen(false)}
        onOk={handleCertSubmit}
        okText="提交"
        cancelText="取消"
        confirmLoading={certSubmitting}
        destroyOnClose
      >
        <Spin spinning={certLoading}>
          {isIndividualCert && (
            <Alert
              message="该用户已完成个人实名认证"
              description="如需切换为企业或高校认证，请选择认证主体并填写信息后提交。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form form={certForm} layout="vertical" style={{ marginTop: 16 }} initialValues={{ subject: 'Enterprise' }}>
            <Form.Item name="subject" label="认证主体" rules={[{ required: true, message: '请选择认证主体' }]}>
              <Radio.Group>
                <Radio value="Enterprise">企业</Radio>
                <Radio value="College">高校</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="certName" label="认证名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="企业名称 / 高校名称" />
            </Form.Item>
            <Form.Item name="certNo" label="证件号" rules={[{ required: true, message: '请输入证件号' }]}>
              <Input placeholder="营业执照号 / 组织机构代码" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}

