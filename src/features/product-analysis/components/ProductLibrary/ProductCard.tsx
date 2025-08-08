"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  MoreVertical,
  Trash2,
  Wand2,
  ImageIcon,
  Calendar,
  Box,
  Palette,
  Layers
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserProduct } from "../../types"
import { deleteProduct } from "../../services/api"
import { toast } from "sonner"

interface ProductCardProps {
  product: UserProduct
  viewMode: "grid" | "list"
  onUpdate?: () => void
  canDelete?: boolean
}

export function ProductCard({ product, viewMode, onUpdate, canDelete = true }: ProductCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      setLoading(true)
      await deleteProduct(product.id)
      toast.success("Product deleted successfully")
      onUpdate?.()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrompt = () => {
    router.push(`/dashboard/products/${product.id}/generate`)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const renderAnalysisChips = () => {
    const a: any = product.analysis_data || {}
    const chips: Array<{ label: string; icon: JSX.Element }> = []
    if (a.productType) chips.push({ label: a.productType, icon: <Box className="h-3 w-3" /> })
    if (Array.isArray(a.dominantColors) && a.dominantColors.length)
      chips.push({ label: a.dominantColors.slice(0, 1)[0], icon: <Palette className="h-3 w-3" /> })
    if (Array.isArray(a.materials) && a.materials.length)
      chips.push({ label: a.materials.slice(0, 1)[0], icon: <Layers className="h-3 w-3" /> })

    if (chips.length === 0) return null

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.slice(0, 3).map((chip, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-700"
          >
            {chip.icon}
            {chip.label}
          </span>
        ))}
      </div>
    )
  }

  // LIST VIEW — compact row
  if (viewMode === "list") {
    return (
      <div className="group rounded-3xl bg-gradient-to-br from-gray-100 to-white p-[1px] shadow-sm hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4">
          {/* Fixed thumbnail container (no ring) */}
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
            {!imageError ? (
              // Centered image inside fixed container
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Fixed two-line title area */}
                <h3 className="text-[15px] font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[2.4rem]">
                  {product.name}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(product.created_at)}
                </div>
                {renderAnalysisChips()}
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleCreatePrompt} size="sm" className="h-8 rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700">
                  <Wand2 className="mr-1 h-3 w-3" />
                  Generate
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-8 w-8 rounded-lg border-gray-200 p-0 hover:border-gray-300"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-600" />
                  </Button>
                  {showMenu && (
                    <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-gray-200 bg-white shadow-lg">
                      {canDelete ? (
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          onClick={handleDelete}
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-400">Pro required</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // GRID VIEW — framed image with fixed container
  return (
    <div className="group rounded-3xl bg-gradient-to-br from-gray-100 to-white p-[1px] shadow-sm hover:shadow-xl transition-all hover:-translate-y-0.5">
      <Card className="rounded-3xl bg-white overflow-visible">
        {/* Framed image (no ring) */}
        <div className="px-3 pt-3">
          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
            {!imageError ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-36 max-w-36 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-4 pt-3">
          <div>
            {/* Fixed two-line title area */}
            <h3 className="line-clamp-2 min-h-[2.4rem] text-sm font-semibold leading-tight text-gray-900">
              {product.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(product.created_at)}</span>
            </div>
            {renderAnalysisChips()}
          </div>

          <div className="mt-1" />
        </div>

        {/* Bottom CTA with Generate + More */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <Button onClick={handleCreatePrompt} className="h-10 flex-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <Wand2 className="mr-2 h-4 w-4" /> Generate Prompt
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="h-10 w-10 rounded-lg border-gray-200 p-0 hover:border-gray-300"
              >
                <MoreVertical className="h-5 w-5 text-gray-700" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 bottom-12 z-30 w-36 rounded-xl border border-gray-200 bg-white shadow-lg">
                  {canDelete ? (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-400">Pro required</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 