import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  AppstoreOutlined,
  UserOutlined,
  GiftOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { fetchProducts } from '@/services/api'
import { appName } from '@/utils/config'


const { Header, Sider, Content } = Layout
const { Text } = Typography


const PRODUCT_LABEL_MAP: Record<string, string> = {
  'zestu-container-instance': '容器管理',
  'zestu-file-storage': '文件存储',
  'zestu-local-storage': '本地盘',
  'hydra-maas': 'MaaS',
  'hydra-model-inference': '模型部署',
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const [menuItems, setMenuItems] = useState<MenuProps['items']>([])

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const products = await fetchProducts()
        const productMenuItems = products.map((p) => ({
          key: `/products/${p.id}`,
          label: PRODUCT_LABEL_MAP[p.name] || p.name,
        }))


        const sortOrder = [
          'zestu-container-instance',
          'zestu-file-storage',
          'zestu-local-storage',
          'hydra-maas',
          'hydra-model-inference',
        ]

        productMenuItems.sort((a, b) => {
          const indexA = sortOrder.findIndex(key => a.key.includes(key))
          const indexB = sortOrder.findIndex(key => b.key.includes(key))

          if (indexA !== -1 && indexB !== -1) return indexA - indexB

          if (indexA !== -1) return -1

          if (indexB !== -1) return 1

          return (a.label as string).localeCompare(b.label as string)
        })

        const items: MenuProps['items'] = [
          {
            key: 'sku-management',
            icon: <AppstoreOutlined />,
            label: '产品管理',
            children: [
              ...productMenuItems,
              { key: '/discount-rules', label: '折扣率管理' },
            ],
          },
          { key: '/users', icon: <UserOutlined />, label: '客户管理' },
          { key: '/vouchers/create', icon: <GiftOutlined />, label: '代金券管理' },
        ]

        setMenuItems(items)
      } catch (error) {
        console.error('Failed to load menu items:', error)
      }
    }

    loadMenus()
  }, [])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={styles.logo}>
          <img src="/logo.svg" alt="d.run" style={{ height: 26, marginRight: 10 }} />
          <Text strong style={{ fontSize: 16, letterSpacing: -0.3, color: '#111' }}>{appName()}</Text>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          defaultOpenKeys={['sku-management']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ ...styles.header, background: token.colorBgContainer }}>
          <div />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
            placement="bottomRight"
          >
            <div style={styles.userInfo}>
              <UserOutlined />
              <Text>{user?.username}</Text>
              <DownOutlined style={{ fontSize: 12 }} />
            </div>
          </Dropdown>
        </Header>
        <Content style={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  logo: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #f0f0f0',
  },
  header: {
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f0f0f0',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
  },
  content: {
    margin: 24,
    padding: 24,
    background: '#fff',
    borderRadius: 8,
    minHeight: 280,
  },
}
