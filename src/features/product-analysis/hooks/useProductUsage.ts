import { useState, useEffect, useCallback } from 'react'
import { UsageLimits } from '../types/usage'
import { getUserUsageLimits, canUserDeleteProduct } from '../services/usage-api'

export function useProductUsage() {
  const [limits, setLimits] = useState<UsageLimits | null>(null)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [usageLimits, deletePermission] = await Promise.all([
        getUserUsageLimits(),
        canUserDeleteProduct()
      ])
      
      setLimits(usageLimits)
      setCanDelete(deletePermission)
    } catch (err) {
      console.error('Error fetching usage data:', err)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load usage data on mount and refresh every 30 seconds
  useEffect(() => {
    refreshUsage()
    
    const interval = setInterval(() => {
      refreshUsage()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [refreshUsage])

  return {
    limits,
    canDelete,
    loading,
    error,
    refreshUsage
  }
} 