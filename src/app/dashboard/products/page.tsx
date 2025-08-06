import { ProductLibrary } from '@/features/product-analysis/components/ProductLibrary/ProductLibrary'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload your products and create stunning reveal videos with AI
        </p>
      </div>
      <ProductLibrary />
    </div>
  )
} 