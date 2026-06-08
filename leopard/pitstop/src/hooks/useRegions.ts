import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { fetchRegions } from '@/services/api'
import type { Region } from '@/types/sku'

interface UseRegionsReturn {
  regions: Region[]
  loading: boolean
  selectedRegion: string
  setSelectedRegion: (id: string) => void
}

export function useRegions(): UseRegionsReturn {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('')

  const loadRegions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRegions()
      setRegions(data)
      // 默认选中第一个区域
      if (data.length > 0 && !selectedRegion) {
        setSelectedRegion(data[0].regionId)
      }
    } catch (error) {
      console.error('Failed to fetch regions:', error)
      message.error('获取区域列表失败')
    } finally {
      setLoading(false)
    }
  }, [selectedRegion])

  useEffect(() => {
    loadRegions()
  }, []) // 只在挂载时加载一次

  return {
    regions,
    loading,
    selectedRegion,
    setSelectedRegion,
  }
}
