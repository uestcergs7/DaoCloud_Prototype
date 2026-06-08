import { useState, useCallback } from 'react'
import { message } from 'antd'
import { fetchSKUs, updateSKUStatus } from '@/services/api'
import type { SKU, PaginationParams } from '@/types/sku'

interface UseSKUsOptions {
  product?: string
  region?: string
}

interface UseSKUsReturn {
  skus: SKU[]
  loading: boolean
  pagination: PaginationParams
  fetchData: (page?: number, pageSize?: number) => Promise<void>
  handleStatusChange: (id: string, currentStatus: string) => Promise<void>
  refresh: () => void
}

export function useSKUs(options: UseSKUsOptions): UseSKUsReturn {
  const { product, region } = options

  const [skus, setSkus] = useState<SKU[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationParams>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const fetchData = useCallback(async (page: number = 1, pageSize: number = 10) => {
    setLoading(true)
    try {
      const response = await fetchSKUs(page, pageSize, region, product)
      setSkus(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch SKUs:', error)
      message.error('获取 SKU 列表失败')
    } finally {
      setLoading(false)
    }
  }, [product, region])

  const handleStatusChange = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available'
    const actionText = newStatus === 'available' ? '上架' : '下架'
    
    // 从 SKU 列表中找到对应的 billingType
    const sku = skus.find(s => s.id === id)
    const billingType = sku?.billingType || 'PAY_AS_YOU_GO'
    
    try {
      await updateSKUStatus(id, newStatus, product || '', billingType)
      // 增量更新：只修改该 SKU 的状态
      setSkus(prev => prev.map(s => 
        s.id === id ? { ...s, status: newStatus } : s
      ))
      message.success(`SKU ${actionText}成功`)
    } catch (error) {
      console.error('Failed to update SKU status:', error)
      message.error(`SKU ${actionText}失败`)
    }
  }, [product, skus])

  const refresh = useCallback(() => {
    fetchData(pagination.current, pagination.pageSize)
    message.success('数据刷新成功')
  }, [fetchData, pagination.current, pagination.pageSize])

  return {
    skus,
    loading,
    pagination,
    fetchData,
    handleStatusChange,
    refresh,
  }
}
