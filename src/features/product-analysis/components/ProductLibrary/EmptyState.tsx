"use client"

import { Upload, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  hasProducts: boolean
  onUpload: () => void
}

export function EmptyState({ hasProducts, onUpload }: EmptyStateProps) {
  if (!hasProducts) {
    // No products at all - show upload CTA
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome to Product Library
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Upload your product images and let our AI create stunning reveal videos. 
              Get started by uploading your first product.
            </p>
            <Button
              onClick={onUpload}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Your First Product
            </Button>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <span>Upload product image</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <span>Choose style template</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <span>Generate AI prompt</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Has products but none match current filters
  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-sm">
      <CardContent className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No products found
          </h3>
          <p className="text-gray-900 mb-6">
            No products match your current search criteria. 
            Try adjusting your filters or search terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Clear filters
                console.log('Clear filters')
              }}
            >
              Clear Filters
            </Button>
            <Button
              onClick={onUpload}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 