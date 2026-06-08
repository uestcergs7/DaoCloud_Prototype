import type { ColumnType } from 'antd/es/table'
import { containerColumns } from '@/components/sku/columns/containerColumns'
import { fileStorageColumns } from '@/components/sku/columns/fileStorageColumns'
import { maasColumns } from '@/components/sku/columns/maasColumns'
import { defaultColumns } from '@/components/sku/columns/defaultColumns'
import type { SKU, BillingType } from '@/types/sku'

export interface ProductConfig {
  label: string
  addRoute?: string   // undefined 表示不支持添加
  editRoute?: string  // undefined 表示不支持编辑
  allowedBillingTypes?: BillingType[]  // undefined 表示全部支持
  hideRegionFilter?: boolean  // 隐藏区域筛选（如 MaaS 不需要区域）
  columns: ColumnType<SKU>[]
}

export const PRODUCT_CONFIG: Record<string, ProductConfig> = {
  'zestu-container-instance': {
    label: '容器管理',
    addRoute: '/sku/add/container',
    editRoute: '/sku/edit/container',
    columns: containerColumns,
  },
  'zestu-file-storage': {
    label: '文件存储',
    addRoute: '/sku/add/file-storage',
    editRoute: '/sku/edit/file-storage',
    columns: fileStorageColumns,
  },
  'zestu-local-storage': {
    label: '本地盘',
    addRoute: '/sku/add/local-storage',
    editRoute: '/sku/edit/local-storage',
    columns: fileStorageColumns,
  },
  'hydra-maas': {
    label: 'MaaS',
    addRoute: '/sku/add/maas',
    editRoute: '/sku/edit/maas',
    hideRegionFilter: true,
    columns: maasColumns,
  },
  'hydra-model-inference': {
    label: '模型部署',
    addRoute: '/sku/add/model-inference',
    editRoute: '/sku/edit/model-inference',
    allowedBillingTypes: ['PAY_AS_YOU_GO'],
    columns: containerColumns,
  },
}

export const getProductConfig = (productId: string): ProductConfig => {
  return PRODUCT_CONFIG[productId] || {
    label: productId,
    columns: defaultColumns,
  }
}
