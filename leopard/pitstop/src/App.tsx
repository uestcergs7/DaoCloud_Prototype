import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import DiscountRulesPage from '@/pages/DiscountRulesPage'

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#111',
          borderRadius: 6,
          colorBgLayout: '#fafafa',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Menu: {
            itemSelectedBg: '#f0f0f0',
            itemSelectedColor: '#111',
          },
          Button: {
            primaryShadow: 'none',
          },
        },
      }}
    >
      <AntdApp>
        <DiscountRulesPage />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
