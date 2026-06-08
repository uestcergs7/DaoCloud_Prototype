import { Select, Space } from 'antd'
import type { Product, Region } from '@/types/sku'

const { Option } = Select

interface SKUFiltersProps {
  products: Product[]
  regions: Region[]
  selectedProduct: string
  selectedRegion: string
  onProductChange: (value: string) => void
  onRegionChange: (value: string | undefined) => void
  loading?: boolean
  hideProductSelection?: boolean
  hideRegionFilter?: boolean
}

export default function SKUFilters({
  products,
  regions,
  selectedProduct,
  selectedRegion,
  onProductChange,
  onRegionChange,
  loading,
  hideProductSelection,
  hideRegionFilter,
}: SKUFiltersProps) {
  return (
    <Space>
      {!hideRegionFilter && (
        <>
          <span>地区:</span>
          <Select
            style={{ width: 200 }}
            placeholder="请选择区域"
            value={selectedRegion || undefined}
            onChange={onRegionChange}
            allowClear
            loading={loading}
          >
            {regions.map((region) => (
              <Option key={region.regionId} value={region.regionId}>
                {region.regionId}
              </Option>
            ))}
          </Select>
        </>
      )}
      {!hideProductSelection && (
        <Select
          style={{ width: 200 }}
          placeholder="请选择产品"
          value={selectedProduct || undefined}
          onChange={onProductChange}
          loading={loading}
        >
          {products.map((product) => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
      )}
    </Space>
  )
}
