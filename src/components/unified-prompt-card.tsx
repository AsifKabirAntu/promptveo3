"use client"

import { useState, useEffect } from "react"
import { Heart, Eye, Edit, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { toggleFavorite, isFavorited, type UnifiedPrompt } from "@/lib/favorites"
import { toast } from "sonner"

interface UnifiedPromptCardProps {
  prompt: UnifiedPrompt
  onViewPrompt?: (prompt: UnifiedPrompt) => void
  onFavoriteToggle?: () => void
}

export function UnifiedPromptCard({ prompt, onViewPrompt, onFavoriteToggle }: UnifiedPromptCardProps) {
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkFavorite() {
      try {
        const isFav = await isFavorited(prompt)
        setFavorite(isFav)
      } catch (error) {
        console.error('Error checking favorite status:', error)
      } finally {
        setLoading(false)
      }
    }
    checkFavorite()
  }, [prompt])

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent card navigation
    try {
      setLoading(true)
      console.log('Toggling favorite for prompt:', prompt.id, prompt.title)
      const success = await toggleFavorite(prompt)
      console.log('Toggle favorite result:', success)
      
      // Update local state based on the toggle result
      setFavorite(!favorite)
      console.log('Favorite updated locally:', !favorite)
      
      // Show toast notification
      if (!favorite) {
        toast.success('Added to favorites', {
          description: prompt.title,
          duration: 2000,
        })
      } else {
        toast('Removed from favorites', {
          description: prompt.title,
          duration: 2000,
          style: {
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
          },
          icon: <Heart className="w-4 h-4 text-red-600" />,
        })
      }
      
      // Always call the refresh callback after a successful toggle
      onFavoriteToggle?.()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorites', {
        description: 'Please try again',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
              {prompt.category}
            </Badge>
            {prompt.type === 'timeline' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                Timeline
              </Badge>
            )}
          </div>
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full transition-colors ${
              loading ? 'opacity-50' : favorite 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            disabled={loading}
          >
            <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div 
          onClick={() => onViewPrompt?.(prompt)}
          className="block group cursor-pointer"
        >
          <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {prompt.title}
          </h3>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {prompt.description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewPrompt?.(prompt)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View
          </Button>
          
          <Link
            href={prompt.type === 'timeline' 
              ? `/dashboard/editor?remix-timeline=${prompt.id}` 
              : `/dashboard/editor?remix=${prompt.id}`}
            className="flex-1"
          >
            <Button variant="default" size="sm" className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              Remix
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 