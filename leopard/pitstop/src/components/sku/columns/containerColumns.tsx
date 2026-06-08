import type { ColumnType } from 'antd/es/table'
import type { SKU } from '@/types/sku'
import { baseColumns, priceColumn, billingTypeColumn, statusColumn, displayOrderColumn, discountColumn } from './common'

// GPU 相关列
const gpuColumns: ColumnType<SKU>[] = [
  {
    title: 'GPU型号',
    dataIndex: 'gpuModel',
    key: 'gpuModel',
    width: 150,
  },
  {
    title: 'GPU类型',
    dataIndex: 'gpuType',
    key: 'gpuType',
    width: 80,
  },
  {
    title: 'GPU数量',
    dataIndex: 'gpuCount',
    key: 'gpuCount',
    width: 80,
    render: (count: string, record: SKU) =>
      record.gpuType === 'vgpu' ? '-' : count,
  },
  {
    title: 'GPU内存',
    dataIndex: 'gpuMemory',
    key: 'gpuMemory',
    width: 90,
    render: (memory: string, record: SKU) => {
      if (record.gpuType === 'vgpu') return '-'
      const mb = parseFloat(memory) || 0
      const gb = mb >= 1024 ? (mb / 1024).toFixed(0) : (mb / 1024).toFixed(1)
      return `${gb}GB`
    },
  },
  {
    title: 'vGPU算力',
    dataIndex: 'vgpuPower',
    key: 'vgpuPower',
    width: 90,
    render: (power: string, record: SKU) =>
      record.gpuType === 'gpu' ? '-' : `${power}%`,
  },
  {
    title: 'vGPU内存',
    dataIndex: 'vgpuMemory',
    key: 'vgpuMemory',
    width: 90,
    render: (memory: string, record: SKU) => {
      if (record.gpuType === 'gpu') return '-'
      const mb = parseFloat(memory) || 0
      const gb = mb >= 1000 ? (mb / 1000).toFixed(0) : (mb / 1000).toFixed(1)
      return `${gb}GB`
    },
  },
]

// CPU/Memory 列
const resourceColumns: ColumnType<SKU>[] = [
  {
    title: 'CPU',
    dataIndex: 'cpu',
    key: 'cpu',
    width: 70,
    render: (cpu: string) => cpu ? `${cpu}核` : '-',
  },
  {
    title: '内存',
    dataIndex: 'memory',
    key: 'memory',
    width: 80,
    render: (memory: string) => {
      const mb = parseFloat(memory) || 0
      const gb = mb >= 1000 ? (mb / 1000).toFixed(0) : (mb / 1000).toFixed(1)
      return `${gb}GB`
    },
  },
]

// 容器实例完整列配置（不含操作列）
export const containerColumns: ColumnType<SKU>[] = [
  ...baseColumns,
  priceColumn,
  billingTypeColumn,
  discountColumn,
  ...gpuColumns,
  ...resourceColumns,
  displayOrderColumn,
  statusColumn,
]
