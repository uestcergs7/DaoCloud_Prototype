import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { fetchProducts } from '@/services/api'
import type { Product } from '@/types/sku'

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  selectedProduct: string
  setSelectedProduct: (id: string) => void
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchProducts()

      // 使用与 AdminLayout 相同的排序顺序
      const sortOrder = [
        'zestu-container-instance',
        'zestu-file-storage',
        'zestu-local-storage',
        'hydra-maas',
        'hydra-model-inference',
      ]

      const sorted = [...data].sort((a, b) => {
        const indexA = sortOrder.findIndex(key => a.id.includes(key))
        const indexB = sortOrder.findIndex(key => b.id.includes(key))
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.name.localeCompare(b.name)
      })

      setProducts(sorted)
      // 默认选中第一个产品
      if (sorted.length > 0 && !selectedProduct) {
        setSelectedProduct(sorted[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      message.error('获取产品列表失败')
    } finally {
      setLoading(false)
    }
  }, [selectedProduct])

  useEffect(() => {
    loadProducts()
  }, []) // 只在挂载时加载一次

  return {
    products,
    loading,
    selectedProduct,
    setSelectedProduct,
  }
}
