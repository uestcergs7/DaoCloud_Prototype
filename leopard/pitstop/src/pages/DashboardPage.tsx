import { useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Typography, Button, Space, Row, Col, Tooltip, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import SKUTable from '@/components/sku/SKUTable'
import SKUFilters from '@/components/sku/SKUFilters'
import { useSKUs } from '@/hooks/useSKUs'
import { useProducts } from '@/hooks/useProducts'
import { useRegions } from '@/hooks/useRegions'
import { getProductConfig } from '@/config/productConfig'

const { Title } = Typography

export default function DashboardPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()

  // 使用自定义 Hooks
  const { products, selectedProduct, setSelectedProduct } = useProducts()
  const { regions, selectedRegion, setSelectedRegion } = useRegions()

  // URL 参数优于内部状态
  const activeProduct = productId || selectedProduct

  // 获取产品配置
  const productConfig = getProductConfig(activeProduct)

  const { skus, loading, pagination, fetchData, handleStatusChange, refresh } = useSKUs({
    product: activeProduct,
    region: productConfig.hideRegionFilter ? '' : selectedRegion,
  })

  // 如果没有 productId 但有 selectedProduct，自动跳转到第一个产品页面
  useEffect(() => {
    if (!productId && selectedProduct) {
      navigate(`/products/${selectedProduct}`, { replace: true })
    }
  }, [productId, selectedProduct, navigate])

  // 当 URL 中有 productId 时，更新选中的产品
  useEffect(() => {
    if (productId && productId !== selectedProduct) {
      setSelectedProduct(productId)
    }
  }, [productId, setSelectedProduct, selectedProduct])

  // 产品或区域变化时重新加载数据
  useEffect(() => {
    if (activeProduct) {
      fetchData(1, pagination.pageSize)
    }
  }, [activeProduct, selectedRegion])

  // 产品选择变化
  const handleProductChange = useCallback((value: string) => {
    // 如果 URL 中有 productId，则不允许切换（其实 dropdown 应该被隐藏）
    if (productId) return
    setSelectedProduct(value)
  }, [setSelectedProduct, productId])

  // 区域选择变化
  const handleRegionChange = useCallback((value: string | undefined) => {
    setSelectedRegion(value || '')
  }, [setSelectedRegion])

  // 分页变化
  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    fetchData(page, pageSize)
  }, [fetchData])

  // 添加按钮点击
  const handleAddClick = () => {
    if (productConfig.addRoute) {
      navigate(productConfig.addRoute)
    } else {
      message.info('该产品暂不支持添加 SKU')
    }
  }

  // 添加按钮是否禁用
  const addButtonDisabled = !productConfig.addRoute

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            {productConfig.label}
          </Title>
        </Col>
      </Row>

      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <SKUFilters
            products={products}
            regions={regions}
            selectedProduct={activeProduct}
            selectedRegion={selectedRegion}
            onProductChange={handleProductChange}
            onRegionChange={handleRegionChange}
            hideProductSelection={!!productId}
            hideRegionFilter={!!productConfig.hideRegionFilter}
          />
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              刷新
            </Button>
            {addButtonDisabled ? (
              <Tooltip title="该产品暂不支持添加 SKU">
                <Button type="primary" icon={<PlusOutlined />} disabled>
                  添加
                </Button>
              </Tooltip>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddClick}
              >
                添加
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <SKUTable
        skus={skus}
        loading={loading}
        pagination={pagination}
        product={activeProduct}
        onPaginationChange={handlePaginationChange}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
