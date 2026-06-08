import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/layouts/AdminLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import AddContainerSKUPage from '@/pages/sku/AddContainerSKUPage'
import EditContainerSKUPage from '@/pages/sku/EditContainerSKUPage'
import AddStorageSKUPage from '@/pages/sku/AddStorageSKUPage'
import EditStorageSKUPage from '@/pages/sku/EditStorageSKUPage'
import AddMaaSSKUPage from '@/pages/sku/AddMaaSSKUPage'
import EditMaaSSKUPage from '@/pages/sku/EditMaaSSKUPage'
import UsersPage from '@/pages/UsersPage'
import UserDetailPage from '@/pages/UserDetailPage'
import CreateVoucherPage from '@/pages/CreateVoucherPage'
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
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="products/:productId" element={<DashboardPage />} />
                <Route path="sku/add/container" element={<AddContainerSKUPage />} />
                <Route path="sku/edit/container/:skuId" element={<EditContainerSKUPage />} />
                <Route path="sku/add/file-storage" element={<AddStorageSKUPage productName="zestu-file-storage" defaultFreeQuantity={20} />} />
                <Route path="sku/edit/file-storage/:skuId" element={<EditStorageSKUPage productName="zestu-file-storage" />} />
                <Route path="sku/add/local-storage" element={<AddStorageSKUPage productName="zestu-local-storage" />} />
                <Route path="sku/edit/local-storage/:skuId" element={<EditStorageSKUPage productName="zestu-local-storage" />} />
                <Route path="sku/add/model-inference" element={<AddContainerSKUPage productName="hydra-model-inference" />} />
                <Route path="sku/edit/model-inference/:skuId" element={<EditContainerSKUPage productName="hydra-model-inference" />} />
                <Route path="sku/add/maas" element={<AddMaaSSKUPage />} />
                <Route path="sku/edit/maas/:skuId" element={<EditMaaSSKUPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:userId" element={<UserDetailPage />} />
                <Route path="discount-rules" element={<DiscountRulesPage />} />
                <Route path="vouchers" element={<Navigate to="/vouchers/create" replace />} />
                <Route path="vouchers/create" element={<CreateVoucherPage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
