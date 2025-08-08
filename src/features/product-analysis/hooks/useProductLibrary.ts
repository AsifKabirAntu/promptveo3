import { useState, useEffect } from 'react'
import { UserProduct, ProductLibraryState } from '../types'
import { getUserProducts } from '../services/api'

export function useProductLibrary() {
  const [state, setState] = useState<ProductLibraryState>({
    products: [],
    loading: true,
    error: null,
    searchQuery: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const setProducts = (products: UserProduct[]) => {
    setState(prev => ({ ...prev, products }))
  }

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }

  const setSearchQuery = (searchQuery: string) => {
    setState(prev => ({ ...prev, searchQuery }))
  }

  const setSortBy = (sortBy: 'name' | 'created_at') => {
    setState(prev => ({ ...prev, sortBy }))
  }

  const setSortOrder = (sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortOrder }))
  }

  const refreshProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const products = await getUserProducts()
      setProducts(products)
    } catch (error) {
      console.error('Error fetching products:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProducts()
  }, [])

  return {
    products: state.products,
    loading: state.loading,
    error: state.error,
    searchQuery: state.searchQuery,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    refreshProducts
  }
} 