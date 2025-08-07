"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreVertical, 
  Trash2, 
  Sparkles, 
  Wand2, 
  ImageIcon, 
  Box, 
  Tag,
  Palette,
  Layers,
  Calendar,
  HardDrive
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserProduct } from '../../types'
import { deleteProduct } from '../../services/api'
import { toast } from 'sonner'

interface ProductCardProps {
  product: UserProduct
  viewMode: 'grid' | 'list'
  onUpdate?: () => void
  canDelete?: boolean
}

export function ProductCard({ product, viewMode, onUpdate, canDelete = true }: ProductCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      setLoading(true)
      await deleteProduct(product.id)
      toast.success('Product deleted successfully')
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrompt = () => {
    // Navigate to the inline wizard page
    router.push(`/dashboard/products/${product.id}/generate`)
  }

  const isAnalyzed = Object.keys(product.analysis_data || {}).length > 0
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderAnalysisData = () => {
    if (!isAnalyzed) return null

    const analysis = product.analysis_data as any
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-blue-700 font-medium">PromptVeo3 Analyzed</span>
        </div>
        
        <div className="space-y-1">
          {analysis.productType && (
            <div className="flex items-center gap-4">
              <Box className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-gray-600">{analysis.productType}</span>
            </div>
          )}
          
          {analysis.dominantColors && analysis.dominantColors.length > 0 && (
            <div className="flex items-center gap-4">
              <Palette className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-gray-600">{analysis.dominantColors.slice(0, 2).join(', ')}</span>
            </div>
          )}
          
          {analysis.materials && analysis.materials.length > 0 && (
            <div className="flex items-center gap-4">
              <Layers className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-gray-600">{analysis.materials.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          {/* Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-50 flex-shrink-0">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6" style={{ color: '#3b82f6' }} />
              </div>
            ) : (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(product.created_at)}
                  </span>
                                     
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreatePrompt}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generate
                </Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMenu(!showMenu)}
                    className="border-blue-300 hover:border-blue-400 p-1.5 w-7 h-7"
                    style={{ color: '#1d4ed8' }}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                  {showMenu && (
                    <div className="absolute right-0 top-8 w-28 bg-white rounded-lg shadow-lg z-20 border border-blue-200">
                      <button
                        className="w-full px-2 py-1.5 text-xs flex items-center gap-1.5 hover:bg-red-50 font-semibold"
                        style={{ color: '#dc2626' }}
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {renderAnalysisData()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-4">
        {/* Image */}
        <div className="aspect-square w-20 h-20 mx-auto rounded-lg overflow-hidden bg-blue-50 mb-3">
          {imageError ? (
            <div className="w-full h-full flex justify-start">
              <ImageIcon className="w-20 h-20" style={{ color: '#3b82f6' }} />
            </div>
          ) : (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Title and AI Badge */}
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</h3>
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
              {product.category}
            </Badge>
          </div>

          {/* Analysis Data */}
          {renderAnalysisData()}

          {/* Metadata */}
          <div className="text-left text-xs text-gray-500 space-y-1">
            <div className="flex justify-start gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(product.created_at)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleCreatePrompt}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Generate Prompt
            </Button>
          </div>
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white/90 border-blue-300 hover:border-blue-400 hover:bg-white p-1.5 w-7 h-7"
              style={{ color: '#1d4ed8' }}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-8 w-28 bg-white rounded-lg shadow-lg z-20 border border-blue-200">
                {canDelete ? (
                  <button
                    className="w-full px-2 py-1.5 text-xs flex items-center gap-1.5 hover:bg-red-50 font-semibold"
                    style={{ color: '#dc2626' }}
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                ) : (
                  <div className="w-full px-2 py-1.5 text-xs text-gray-400">
                    Pro required
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 