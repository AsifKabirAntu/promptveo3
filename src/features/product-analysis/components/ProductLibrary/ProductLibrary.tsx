"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Grid3X3, LayoutGrid, Upload, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProductUploadModal } from './ProductUploadModal'
import { ProductCard } from './ProductCard'
import { ProductGrid } from './ProductGrid'
import { EmptyState } from './EmptyState'
import { useProductLibrary } from '../../hooks/useProductLibrary'
import { useProductUsage } from '../../hooks/useProductUsage'
import { PRODUCT_CATEGORIES } from '../../types'
import { Paywall } from '@/components/ui/paywall'

export function ProductLibrary() {
  const {
    products,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    refreshProducts
  } = useProductLibrary()

  const {
    limits,
    canDelete,
    loading: usageLoading,
    error: usageError,
    refreshUsage
  } = useProductUsage()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleUploadSuccess = async () => {
    setShowUploadModal(false)
    await refreshProducts()
    // Refresh usage data immediately after upload
    await refreshUsage()
  }

  // Listen for usage updates from other components
  useEffect(() => {
    const handleUsageUpdate = () => {
      refreshUsage()
    }

    window.addEventListener('usage-updated', handleUsageUpdate)
    
    return () => {
      window.removeEventListener('usage-updated', handleUsageUpdate)
    }
  }, [refreshUsage])

  const handleUploadClick = () => {
    if (limits && !limits.canUpload) {
      setShowPaywall(true)
    } else {
      setShowUploadModal(true)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'category':
        return a.category.localeCompare(b.category)
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900">Library Overview</h2>
            </div>
            <Button
              onClick={handleUploadClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={usageLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Product
            </Button>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Total Products */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(products.map(p => p.category)).size}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Filter className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Ready */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Ready</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.filter(p => Object.keys(p.analysis_data).length > 0).length}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits Card */}
            {limits && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Usage</p>
                      <div className="h-8 w-8 bg-gray-100 rounded-xl flex items-center justify-center">
                        {usageLoading ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Grid3X3 className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* Uploads Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 font-medium">Uploads</span>
                          <span className={`font-semibold ${limits.canUpload ? "text-green-600" : "text-red-500"}`}>
                            {limits.uploadsUsed}/{limits.maxUploads}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              limits.canUpload ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min((limits.uploadsUsed / limits.maxUploads) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Prompts Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 font-medium">Prompts</span>
                          <span className={`font-semibold ${limits.canGeneratePrompt ? "text-green-600" : "text-red-500"}`}>
                            {limits.promptsUsed}/{limits.maxPrompts}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              limits.canGeneratePrompt ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min((limits.promptsUsed / limits.maxPrompts) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-20 bg-white/70 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                  className={selectedCategory === '' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  All Categories
                </Button>
                {PRODUCT_CATEGORIES.slice(0, 6).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || searchQuery) && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Display */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-blue-200 focus:ring-blue-200 text-gray-900 pr-4"
              >
                <option value="created_at">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>

          {loading ? (
            <ProductGrid products={[]} loading={true} viewMode={viewMode} />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading products: {error}</p>
              <Button onClick={refreshProducts} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <EmptyState 
              hasProducts={products.length > 0}
              onUpload={() => setShowUploadModal(true)}
            />
          ) : (
            <ProductGrid 
              products={sortedProducts} 
              loading={false} 
              viewMode={viewMode}
              onProductUpdate={async () => {
                await refreshProducts()
                await refreshUsage()
              }}
              canDelete={canDelete}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <ProductUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md">
            <Paywall
              title="Upload Limit Reached"
              description={`You've reached your monthly upload limit of ${limits?.maxUploads || 1} photo${limits?.maxUploads === 1 ? '' : 's'}. Upgrade to Pro for 20 uploads per month.`}
              feature="More photo uploads"
              onClose={() => setShowPaywall(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 